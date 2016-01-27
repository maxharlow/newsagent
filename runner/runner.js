'use strict'

const Promisify = require('promisify-node')
const FS = require('fs')
const Path = require('path')
const Process = require('process')
const ChildProcess = require('child_process')
const Git = require('nodegit')
const Schedule = require('node-schedule')
const NeatCSV = require('neat-csv')
const PouchDB = require('pouchdb')
const DeepEqual = require('deep-equal')
const Nodemailer = require('nodemailer')
const Config = require('./config.json')

async function setup() {
    const args = Process.argv.slice(2)
    const filename = args[0]
    const dateStarted = new Date()
    try {
        const data = await Promisify(FS.readFile)(filename)
        const recipe = JSON.parse(data.toString())
        await Git.Clone(recipe.location, 'source')
        const messages = await sequentially(shell(), recipe.setup)
        await Schedule.scheduleJob(recipe.schedule, () => run(recipe))
        const dateFinished = new Date()
        const log = {
            state: 'success',
            date: dateStarted.toISOString(),
            duration: dateFinished - dateStarted,
            messages
        }
        store('setup-log', log)
    }
    catch (e) {
        const log = {
            state: 'failure',
            date: dateStarted.toISOString(),
            message: e.message
        }
        store('setup-log', log)
    }
}

async function run(recipe) {
    const dateStarted = new Date()
    try {
        const repo = await repository(recipe.updatable)
        const revision = await repositoryRevision(repo)
        const messages = await sequentially(shell('source'), recipe.run)
        const data = await csv('source/' + recipe.result)
        await store('data', data)
        const stored = await retrieve()
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
        store('run-log', log)
    }
    catch (e) {
        const log = {
            state: 'failure',
            date: dateStarted.toISOString(),
            message: e.message
        }
        store('run-log', log)
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
    const db = new PouchDB('data')
    return db.put({ _id: type + '/' + new Date().toISOString(), data })
}

async function retrieve() {
    const db = new PouchDB('data')
    const response = await db.allDocs({ startkey: 'data/\uffff', endkey: 'data/', include_docs: true, descending: true, limit: 2 })
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

setup()
