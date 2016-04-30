'use strict'

import Promisify from 'promisify-node'
import FS from 'fs'
import Path from 'path'
import Process from 'process'
import ChildProcess from 'child_process'
import Schedule from 'node-schedule'
import NeatCSV from 'neat-csv'
import DeepEqual from 'deep-equal'
import Nodemailer from 'nodemailer'
import * as Database from './Database'
import * as Email from './Email'
import Config from './config.json'

export async function setup(filename) {
    const id = Path.parse(filename).name
    const dateStarted = new Date()
    const data = await Promisify(FS.readFile)(filename)
    const recipe = JSON.parse(data.toString())
    await Promisify(FS.mkdir)(Config.sourceLocation)
    const messages = await sequentially(shell(Config.sourceLocation), recipe.setup)
    messages.forEach(message => {
        if (message.type === 'stderr') Process.stderr.write(message.value)
        else if (message.type == 'stdout') Process.stdout.write(message.value)
    })
    const isFailure = messages.some(message => message.type === 'failure')
    Process.exit(isFailure ? 1 : 0)
}

export async function schedule(filename) {
    const id = Path.parse(filename).name
    const data = await Promisify(FS.readFile)(filename)
    const recipe = JSON.parse(data.toString())
    if (recipe.schedule) {
        const job = Schedule.scheduleJob(recipe.schedule, () => run(id, recipe))
        if (job === null) throw new Error('Scheduling failed! Is the crontab valid?')
    }
}

async function run(id, recipe) {
    const dateStarted = new Date()
    try {
        const messages = await sequentially(shell(Config.sourceLocation), recipe.run)
        const isFailure = messages.some(message => message.type === 'failure') // carry on regardless
        const data = await csv(Config.sourceLocation + '/' + recipe.result)
        await Database.add('data', dateStarted.toISOString(), data)
        const stored = await Database.retrieveAll('data', id)
        const diff = await difference(stored[0], stored[1])
        const triggered = await trigger(diff, recipe.triggers, recipe.name)
        const log = {
            state: isFailure ? 'failure' : 'success',
            date: dateStarted.toISOString(),
            duration: new Date() - dateStarted,
            currentDocDate: stored.currentDate,
            previousDocDate: stored.previousDate,
            recordsAdded: diff.added.length,
            recordsRemoved: diff.removed.length,
            messages,
            triggered
        }
        Database.add('run', dateStarted.toISOString(), log)
    }
    catch (e) {
        const log = {
            state: 'system-error',
            date: dateStarted.toISOString(),
            duration: new Date() - dateStarted,
            message: e.stack
        }
        Database.add('run', dateStarted.toISOString(), log)
    }
}

async function csv(location) {
    const data = await Promisify(FS.readFile)(location)
    return Promisify(NeatCSV)(data)
}

function difference(current, previous) {
    if (previous === undefined) return { added: [], removed: [] }
    const currentItems = Object.keys(current).map(key => current[key])
    const previousItems = Object.keys(previous).map(key => previous[key])
    return {
        added: currentItems.filter(currentItem => !previousItems.some(previousItem => DeepEqual(currentItem, previousItem))),
        removed: previousItems.filter(previousItem => !currentItems.some(currentItem => DeepEqual(previousItem, currentItem))),
    }
}

function trigger(diff, triggers, name) {
    const responses = triggers.map(trigger => {
        return (diff.added.length > 0 || diff.removed.length > 0) ? Email.send(trigger.recipient, name, Email.format(diff, name)) : null
    })
    return Promise.all(responses.filter(Boolean))
}

function sequentially(fn, array) {
    return fn(array[0])
        .then(data => array.length > 1 ? sequentially(fn, array.splice(1)) : data)
        .catch(data => data)
}

function shell(location) {
    const path = Path.resolve(location)
    var log = []
    return command => {
        log.push({ type: 'stdin', value: command + '\n' })
        return new Promise((resolve, reject) => {
            const process = ChildProcess.exec(command, { cwd: path })
            process.stdout.on('data', data => log.push({ type: 'stdout', value: data }))
            process.stderr.on('data', data => log.push({ type: 'stderr', value: data }))
            process.on('exit', code => {
                if (code !== 0) {
                    log.push({ type: 'failure', value: '[' + command + ' exited with code ' + code + ']\n' })
                    reject(log)
                }
                else resolve(log)
            })
        })
    }
}
