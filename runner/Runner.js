'use strict'

import Promisify from 'promisify-node'
import FS from 'fs'
import Path from 'path'
import ChildProcess from 'child_process'
import Schedule from 'node-schedule'
import NeatCSV from 'neat-csv'
import PouchDB from 'pouchdb'
import DeepEqual from 'deep-equal'
import Nodemailer from 'nodemailer'
import Config from './config.json'

export async function setup(filename) {
    const id = Path.parse(filename).name
    const dateStarted = new Date()
    try {
        const data = await Promisify(FS.readFile)(filename)
        const recipe = JSON.parse(data.toString())
        await Promisify(FS.mkdir)('source')
        const messages = await sequentially(shell('source'), recipe.setup)
        const job = Schedule.scheduleJob(recipe.schedule, () => run(id, recipe))
        if (job === null) throw new Error('Scheduling failed! Is the crontab valid?')
        const dateFinished = new Date()
        const log = {
            state: 'success',
            date: dateStarted.toISOString(),
            duration: dateFinished - dateStarted,
            messages
        }
        console.log(log)
        store('setup', id, log)
    }
    catch (e) {
        console.log(e.stack)
        const log = {
            state: 'failure',
            date: dateStarted.toISOString(),
            message: e.message
        }
        console.log(log)
        store('setup', id, log)
    }
}

async function run(id, recipe) {
    const dateStarted = new Date()
    try {
        const messages = await sequentially(shell('source'), recipe.run)
        const data = await csv('source/' + recipe.result)
        await store('data', id, data)
        const stored = await retrieveAll('data', id)
        const diff = await difference(stored.current, stored.previous)
        const sent = await trigger(diff, recipe.triggers, recipe.name)
        const dateFinished = new Date()
        const log = {
            state: 'success',
            date: dateStarted.toISOString(),
            duration: dateFinished - dateStarted,
            currentDocDate: stored.currentDate,
            previousDocDate: stored.previousDate,
            recordsAdded: diff.added.length,
            recordsRemoved: diff.removed.length,
            messages,
            sent
        }
        console.log(log)
        store('run', id, log)
    }
    catch (e) {
        const log = {
            state: 'failure',
            date: dateStarted.toISOString(),
            message: e.message
        }
        console.log(log)
        store('run', id, log)
    }
}

async function csv(location) {
    const data = await Promisify(FS.readFile)(location)
    return Promisify(NeatCSV)(data)
}

async function store(type, id, data) {
    const db = new PouchDB(Config.pouchLocation)
    return db.put({ _id: type + '/' + id + '/' + new Date().toISOString(), data })
}

async function retrieveAll(type, id) {
    const db = new PouchDB(Config.pouchLocation)
    const response = await db.allDocs({ startkey: type + '/' + id + '/\uffff', endkey: type + '/' + id + '/', include_docs: true, descending: true, limit: 2 })
    return {
        current: response.rows[0].doc.data,
        currentDate: response.rows[0].id.split('/')[1],
        previous: response.rows[1] ? response.rows[1].doc.data : undefined,
        previousDate: response.rows[1] ? response.rows[1].id.split('/')[1] : undefined
    }
}

function difference(current, previous) {
    if (previous === undefined) return { added: [], removed: [] }
    return {
        added: current.filter(currentItem => !previous.some(previousItem => DeepEqual(currentItem, previousItem))),
        removed: previous.filter(previousItem => !current.some(currentItem => DeepEqual(previousItem, currentItem))),
    }
}

function trigger(diff, triggers, name) {
    const responses = triggers.map(trigger => {
        return (diff.added.length > 0 || diff.removed.length > 0) ? sendEmail(trigger.recipient, name, format(diff, name)) : null
    })
    return Promise.all(responses.filter(Boolean))
}

function format(diff, name) {
    function table(data) {
        if (data.length === 0) return '(None.)'
        return '<table>'
             + '<thead><tr>' + Object.keys(data[0]).map(key => '<td><strong>' + key + '</strong></td>').join('') + '</tr></thead>'
             + data.map(d => '<tr>' + Object.keys(d).map(key => '<td>' + d[key] + '</td>').join('') + '</tr>').join('')
             + '</table>'
    }
    return `<h1>${name}</h1>` + '<h2>Data added</h2>' + table(diff.added) + '<h2>Data removed</h2>' + table(diff.removed)
}

async function sendEmail(recipient, name, text) {
    const message = {
        from: 'Datastash <' + Config.email.from + '>',
        to: recipient,
        subject: '[ALERT] ' + name,
        html: text
    }
    const sent = await Nodemailer.createTransport(Config.email).sendMail(message)
    return sent.response
}

function sequentially(fn, array) {
    return array.reduce((last, command) => last.then(() => fn(command)), Promise.accept())
}

function shell(location) {
    const path = Path.resolve(location)
    var log = []
    return command => {
        log.push({ type: 'command', value: command })
        return new Promise((resolve, reject) => {
            const process = ChildProcess.exec(command, { cwd: path })
            process.stdout.on('data', data => log.push({ type: 'stdout', value: data }))
            process.stderr.on('data', data => log.push({ type: 'stderr', value: data }))
            process.on('exit', code => {
                if (code === 0) resolve(log)
                else reject(new Error(command + ' exited with code ' + code))
            })
        })
    }
}
