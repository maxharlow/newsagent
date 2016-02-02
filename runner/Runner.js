'use strict'

import Promisify from 'promisify-node'
import FS from 'fs'
import Path from 'path'
import Process from 'process'
import ChildProcess from 'child_process'
import Git from 'nodegit'
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
        await Git.Clone(recipe.location, 'source')
        const messages = await sequentially(shell(), recipe.setup)
        const job = Schedule.scheduleJob(recipe.schedule, () => run(id, recipe))
        if (job === null) throw new Error('Scheduling failed! Is the crontab valid?')
        const dateFinished = new Date()
        const log = {
            state: 'success',
            date: dateStarted.toISOString(),
            duration: dateFinished - dateStarted,
            messages
        }
        store(id + '/setup-log', log)
    }
    catch (e) {
        const log = {
            state: 'failure',
            date: dateStarted.toISOString(),
            message: e.message
        }
        console.log(e.stack)
        store(id + '/setup-log', log)
    }
}

async function run(id, recipe) {
    const dateStarted = new Date()
    try {
        const repo = await repository(recipe.updatable)
        const revision = await repositoryRevision(repo)
        const messages = await sequentially(shell('source'), recipe.run)
        const data = await csv('source/' + recipe.result)
        await store(id + '/data', data)
        const stored = await retrieve(id + '/data')
        const diff = await difference(stored.current, stored.previous)
        const sent = await alert(diff, recipe.alerts, recipe.name)
        const dateFinished = new Date()
        const log = {
            state: 'success',
            date: dateStarted.toISOString(),
            duration: dateFinished - dateStarted,
            revision,
            currentDocDate: stored.currentDate,
            previousDocDate: stored.previousDate,
            recordsAdded: diff.added.length,
            recordsRemoved: diff.removed.length,
            messages,
            sent
        }
        store(id + '/run-log', log)
    }
    catch (e) {
        const log = {
            state: 'failure',
            date: dateStarted.toISOString(),
            message: e.message
        }
        store(id + '/run-log', log)
    }
}

async function repository(update) {
    const repo = await Git.Repository.open(Path.resolve('source'))
    if (update) {
        await repo.fetchAll()
        await repo.mergeBranches('master', 'origin/master')
    }
    return repo
}

async function repositoryRevision(repo) {
    const commit = await repo.getBranchCommit('master')
    return commit.id().toString().substr(0, 8)
}

async function csv(location) {
    const data = await Promisify(FS.readFile)(location)
    return Promisify(NeatCSV)(data)
}

async function store(type, data) {
    const db = new PouchDB(Config.pouchLocation)
    return db.put({ _id: type + '/' + new Date().toISOString(), data })
}

async function retrieve(type) {
    const db = new PouchDB(Config.pouchLocation)
    const response = await db.allDocs({ startkey: type + '/\uffff', endkey: type + '/', include_docs: true, descending: true, limit: 2 })
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

function alert(diff, alerts, name) {
    const responses = alerts.map(alert => {
        return (diff.added.length > 0 || diff.removed.length > 0) ? sendEmail(alert.recipient, name, format(diff, name)) : null
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
        from: 'Datastash <datastash@example.com>',
        to: recipient,
        subject: 'Datastash Alert – ' + name,
        html: text
    }
    const sent = await Nodemailer.createTransport(Config.email).sendMail(message)
    return sent.response
}

function sequentially(fn, array) {
    return array.reduce((last, command) => last.then(() => fn(command)), Promise.accept())
}

function shell(location) {
    const path = Path.resolve(location || Process.cwd())
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
