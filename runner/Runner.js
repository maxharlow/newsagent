'use strict'

import Promisify from 'promisify-node'
import FS from 'fs'
import Path from 'path'
import Process from 'process'
import ChildProcess from 'child_process'
import Schedule from 'node-schedule'
import NeatCSV from 'neat-csv'
import Nodemailer from 'nodemailer'
import * as Database from './Database'
import * as Email from './Email'
import Config from './config.json'

export async function setup(filename) {
    const id = Path.parse(filename).name
    const dateStarted = new Date()
    const data = await Promisify(FS.readFile)(filename)
    const recipe = JSON.parse(data.toString())
    await Database.add('system', 'recipe', recipe)
    await Promisify(FS.mkdir)(Config.sourceLocation)
    const commands = recipe.setup
          .map(command => command.replace(/^require /, 'apk add --no-cache '))
          .map(command => command.replace(/ ~/, ' /root'))
    const results = await sequentially(commands, shell(Config.sourceLocation))
    results.forEach(result => {
        result.log.forEach(message => {
            if (message.type === 'stderr') Process.stderr.write(message.value)
            else if (message.type == 'stdout') Process.stdout.write(message.value)
        })
    })
    const isFailure = results.some(message => message.type === 'failure')
    Process.exit(isFailure ? 1 : 0)
}

export async function schedule() {
    const runs = await Database.retrieveAll('run', true, true)
    const zombie = runs.find(run => run.state === 'running')
    if (zombie) {
        const runFailure = {
            state: 'failure',
            initiator: zombie.initiator,
            dateQueued: zombie.dateQueued,
            dateStarted: zombie.dateStarted,
            duration: new Date() - new Date(zombie.dateStarted)
        }
        Database.update('run', zombie.id, runFailure, zombie.rev)
    }
    const recipe = await Database.retrieve('system', 'recipe')
    if (recipe.schedule) {
        const job = Schedule.scheduleJob(recipe.schedule, () => enqueue('scheduled'))
        if (job === null) throw new Error('Scheduling failed! Is the crontab valid?')
    }
}

export async function enqueue(initiator) {
    const runs = await Database.retrieveAll('run')
    const runsIdenticalQueued = runs.filter(run => run.state === 'queued' && run.initiator === initiator)
    if (runsIdenticalQueued.length > 0) throw new Error('duplicate')
    const dateQueued = new Date().toISOString()
    const id = dateQueued.replace(/\D/g, '')
    const run = {
        state: 'queued',
        initiator,
        dateQueued
    }
    return Database.add('run', id, run)
}

export async function dequeue() {
    Database.monitor('run').on('change', document => {
        if (document.state === 'queued') run(document.id)
    })
}

export async function describe() {
    const recipe = await Database.retrieve('system', 'recipe')
    const runs = await Database.retrieveAll('run')
    const runsFinished = runs.filter(run => run.state !== 'queued' && run.state !== 'running')
    const runsSuccessful = runs.filter(run => run.state === 'success')
    const status = {
        numberRuns: runsFinished.length,
        numberRunsSuccessful: runsSuccessful.length,
        successRate: Math.round((runsSuccessful.length / runsFinished.length * 100) * 10) / 10,
        averageRunTime: runsFinished.reduce((a, run) => a + run.duration, 0) / runsFinished.length,
        dateLastSuccessfulRun: runsSuccessful.length > 0 ? runsSuccessful[0].date : null
    }
    return { recipe, status }
}

export async function describeRun(id) {
    const recipe = await Database.retrieve('system', 'recipe')
    const run = await Database.retrieve('run', id)
    return { recipe, run }
}

export async function modify(recipeNew) {
    const recipeCurrent = await Database.retrieve('system', 'recipe', true)
    return Database.update('system', 'recipe', recipeNew, recipeCurrent.rev).then(schedule)
}

export async function difference(id) {
    const runs = await Database.retrieveAll('run', true)
    const runsCurrent = runs.filter(run => run.id === id || run.state === 'success')
    const index = runsCurrent.findIndex(run => run.id === id)
    if (index === runsCurrent.length - 1) return { added: [], removed: [] } // it's the first set of data
    const current = await Database.retrieveSet('data', runsCurrent[index].id)
    const previous = await Database.retrieveSet('data', runsCurrent[index + 1].id)
    const toHash = item => Object.keys(item).map(key => item[key]).sort().join('-')
    const currentHash = current.map(toHash)
    const previousHash = previous.map(toHash)
    const diff = {
        added: current.filter(item => previousHash.indexOf(toHash(item)) < 0),
        removed: previous.filter(item => currentHash.indexOf(toHash(item)) < 0)
    }
    return diff
}

async function run(id) {
    const queued = await Database.retrieve('run', id, true)
    const dateStarted = new Date()
    const runRunning = {
        state: 'running',
        initiator: queued.initiator,
        dateQueued: queued.dateQueued,
        dateStarted: dateStarted.toISOString()
    }
    const running = await Database.update('run', id, runRunning, queued.rev)
    const recipe = await Database.retrieve('system', 'recipe')
    const execution = await execute(id, recipe.run)
    const isFailure = execution.some(result => result.code !== 0)
    if (isFailure) {
        const runFailure = {
            state: 'failure',
            initiator: queued.initiator,
            dateQueued: queued.dateQueued,
            dateStarted: dateStarted.toISOString(),
            duration: new Date() - dateStarted
        }
        Database.update('run', id, runFailure, running.rev)
    }
    else {
        const rows = await csv(Config.sourceLocation + '/' + recipe.result)
        await Database.addSet('data', id, rows)
        const diff = await difference(id)
        await Database.addSet('data-added', id, diff.added)
        await Database.addSet('data-removed', id, diff.removed)
        const triggered = await trigger(diff, recipe.triggers, recipe.name)
        const runSuccess = {
            state: 'success',
            initiator: queued.initiator,
            dateQueued: queued.dateQueued,
            dateStarted: dateStarted.toISOString(),
            duration: new Date() - dateStarted,
            records: rows.length,
            recordsAdded: diff.added.length,
            recordsRemoved: diff.removed.length,
            triggered
        }
        await Database.update('run', id, runSuccess, running.rev)
        removeOldRuns()
    }
}

async function execute(id, commands) {
    var   results = []
    const resultsCreation = await Database.add('execution', id, { results })
    var   resultsRevision = resultsCreation.rev
    const resultsUpdate = () => {
        Database.update('execution', id, { results }, resultsRevision)
            .then(update => resultsRevision = update.rev)
            .catch(e => {}) // ignore conficts
    }
    const resultsUpdater = setInterval(resultsUpdate, 1 * 1000) // in milliseconds
    const invoke = shell(Config.sourceLocation, results)
    return sequentially(commands, invoke)
}

async function removeOldRuns() {
    const runs = await Database.retrieveAll('run', true)
    if (runs.length <= Config.storedRuns) return
    runs.slice(Config.storedRuns).forEach(run => {
        Database.remove('run', run.id)
        if (run.state === 'success') Database.removeSet('data', run.id)
    })
}

async function csv(location) {
    const data = await Promisify(FS.readFile)(location)
    return NeatCSV(data)
}

function trigger(diff, triggers, name) {
    const responses = triggers.map(trigger => {
        return (diff.added.length > 0 || diff.removed.length > 0) ? Email.send(trigger.recipient, name, Email.format(diff, name)) : null
    })
    return Promise.all(responses.filter(Boolean))
}

function sequentially(array, fn, a = []) {
    return fn(array[0], a.length)
        .then(data => array.length > 1 ? sequentially(Array.from(array).splice(1), fn, a.concat(data)) : a.concat(data))
        .catch(data => a.concat(data))
}

function shell(location, results = []) {
    const options = {
        cwd: Path.resolve(location),
        maxBuffer: 8000 * 1024 // largest amount of bytes allows on stdout/stderr before process killed
    }
    return (command, i) => {
        const date = new Date()
        results.push({ command, dateStarted: new Date().toISOString(), log: [] })
        const process = ChildProcess.exec(command, options)
        process.stdout.on('data', data => results[i].log.push({ type: 'stdout', value: data }))
        process.stderr.on('data', data => results[i].log.push({ type: 'stderr', value: data }))
        return new Promise((resolve, reject) => {
            process.on('exit', code => {
                const result = {
                    command,
                    code: code === null ? -1 : code, // null code means process was killed
                    dateStarted: date.toISOString(),
                    duration: new Date() - date,
                    log: results[i].log
                }
                results[i] = result
                if (code > 0 || code === null) reject(result)
                else resolve(result)
            })
        })
    }
}
