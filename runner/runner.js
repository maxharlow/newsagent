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

async function start() {
    const args = Process.argv.slice(2)
    const filename = args[0]
    const dateStarted = new Date()
    try {
        const data = await Promisify(FS.readFile)(filename)
        const recipe = JSON.parse(data.toString())
        await Git.Clone(recipe.location, 'source')
        const log = await sequentially(shell(), recipe.setup)
        await Schedule.scheduleJob(recipe.schedule, () => execute(recipe))
        const dateFinished = new Date()
        const summary = {
            type: 'success',
            date: dateStarted.toISOString(),
            duration: dateFinished - dateStarted,
            log
        }
        console.log(summary) // todo do something with this
    }
    catch (e) {
        const summary = {
            type: 'failure',
            date: dateStarted.toISOString(),
            message: e.message
        }
        console.log(summary) // todo do something with this
    }
}

async function execute(recipe) {
    const dateStarted = new Date()
    try {
        const repo = await repository(recipe.updatable)
        const revision = await repositoryRevision(repo)
        const runLog = await sequentially(shell('source'), recipe.run)
        await store(recipe.result)
        const stored = await comparison()
        const diff = await difference(stored.current, stored.previous)
        const alertLog = await alert(diff, recipe.alerts, recipe.name)
        const dateFinished = new Date()
        const summary = {
            type: 'success',
            date: dateStarted.toISOString(),
            duration: dateFinished - dateStarted,
            revision,
            storeDate: stored.currentDate,
            comparisonDate: stored.previousDate,
            recordsAdded: diff.added.length,
            recordsRemoved: diff.removed.length,
            runLog,
            alertLog
        }
        console.log(summary) // todo do something with this
    }
    catch (e) {
        const summary = {
            type: 'failure',
            date: dateStarted.toISOString(),
            message: e.message
        }
        console.log(summary) // todo should go somewhere
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

async function store(result) {
    const db = new PouchDB('data')
    const csv = await Promisify(FS.readFile)('source/' + result)
    const data = await Promisify(NeatCSV)(csv)
    const document = {
        _id: new Date().toISOString(),
        data: data
    }
    return db.put(document)
}

async function comparison() {
    const db = new PouchDB('data')
    const response = await db.allDocs({ include_docs: true, descending: true, limit: 2 })
    return {
        current: response.rows[0].doc.data,
        currentDate: response.rows[0].id,
        previous: response.rows[1] ? response.rows[1].doc.data : undefined,
        previousDate: response.rows[1] ? response.rows[1].id : undefined
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
            + '<thead><tr>' + Object.keys(data[0]).map(key => '<td>' + key + '</td>').join('') + '</tr></thead>'
            + data.map(d => '<tr>' + Object.keys(d).map(key => '<td><strong>' + d[key] + '</strong></td>').join('') + '</tr>').join('')
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
                if (code === 0) {
                    log.push({ type: 'command-success' })
                    resolve(log)
                }
                else {
                    log.push({ type: 'command-failure', value: code })
                    reject(log)
                }
            })
        })      
    }
}

start()
