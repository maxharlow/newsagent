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

export async function summary() {
    const runs = await Database.retrieveAll('run')
    const runsSuccessful = runs.filter(run => run.state === 'success')
    return {
        numberRuns: runs.length,
        numberRunsSuccessful: runsSuccessful.length,
        successRate: Math.round((runsSuccessful.length / runs.length * 100) * 10) / 10,
        averageRunTime: runs.reduce((a, run) => a + run.duration, 0) / runs.length,
        dateLastSuccessfulRun: runsSuccessful.length > 0 ? runsSuccessful[0].date : null
    }
}

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
    const data = await Promisify(FS.readFile)(filename)
    const recipe = JSON.parse(data.toString())
    if (recipe.schedule) {
        const job = Schedule.scheduleJob(recipe.schedule, () => run(recipe))
        if (job === null) throw new Error('Scheduling failed! Is the crontab valid?')
    }
}

async function run(recipe) {
    const dateStarted = new Date()
    try {
        const messages = await sequentially(shell(Config.sourceLocation), recipe.run)
        const isFailure = messages.some(message => message.type === 'failure')
        if (isFailure) {
            const log = {
                state: 'failure',
                date: dateStarted.toISOString(),
                duration: new Date() - dateStarted,
                messages
            }
            Database.add('run', dateStarted.toISOString(), log)
        }
        else {
            const rows = await csv(Config.sourceLocation + '/' + recipe.result)
            const data = { rows }
            const id = dateStarted.toISOString()
            await Database.add('data', id, data)
            const diff = await difference(id)
            const triggered = await trigger(diff, recipe.triggers, recipe.name)
            const log = {
                state: 'success',
                date: dateStarted.toISOString(),
                duration: new Date() - dateStarted,
                recordsAdded: diff.added.length,
                recordsRemoved: diff.removed.length,
                messages,
                triggered
            }
            Database.add('run', dateStarted.toISOString(), log)
        }
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

export async function difference(id) {
    const data = await Database.retrieveAll('data', true) // note only successful runs store data
    const index = data.findIndex(d => d.id === id)
    if (index === data.length - 1) return { added: [], removed: [] } // it's the first set of data we have
    const current = data[index].rows.map((item, _i) => Object.assign({ _i }, item))
    const previous = data[index + 1].rows.map((item, _i) => Object.assign({ _i }, item))
    const added = current.filter(currentItem => { // current items not in previous
        return !previous.some(previousItem => DeepEqual(currentItem, previousItem))
    })
    const removed = previous.filter(previousItem => { // previous items not in current
        return !current.some(currentItem => DeepEqual(previousItem, currentItem))
    })
    return {
        added: added.map(item => { delete item._i; return item }),
        removed: removed.map(item => { delete item._i; return item })
    }
}

async function csv(location) {
    const data = await Promisify(FS.readFile)(location)
    return Promisify(NeatCSV)(data)
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
