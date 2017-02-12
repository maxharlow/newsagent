'use strict'

import FS from 'fs'
import Path from 'path'
import Stream from 'stream'
import Promisify from 'promisify-node'
import TarStream from 'tar-stream'
import Glob from 'glob'
import JsonSchema from 'jsonschema'
import JsonStream from 'json-stream'
import StripAnsi from 'strip-ansi'
import ToCSV from 'to-csv'
import * as Database from './Database'
import * as Docker from './Docker'
import Config from './config.json'

export async function create(recipe) {
    const validation = validate(recipe)
    if (validation.length > 0) {
        const e = new Error('recipe not valid')
        e.validation = validation
        throw e
    }
    const id = recipe.name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '-').toLowerCase()
    const agent = { state: 'starting', recipe }
    const stored = await Database.add('agent', id, agent)
    build(Object.assign({}, stored, agent)) // runs in background
    return { id: stored.id }
}

export async function get(id) {
    const entry = await Database.retrieve('agent', id)
    if (entry.state !== 'started') return entry
    else {
        const client = await Docker.client()
        const container = await client.getContainer(id)
        const inspection = await container.inspect({ size: true })
        const system = {
            spaceUsed: Math.round((inspection.SizeRootFs / 1024 / 1024) * 100) / 100 // in MB
        }
        const description = await fromContainer(id, 'GET', '/')
        return Object.assign({ id: entry.id, state: entry.state }, description, system)
    }
}

export async function modify(id, recipeChanges) {
    const validation = validate(recipeChanges, true)
    if (validation.length > 0) {
        const e = new Error('recipe not valid')
        e.validation = validation
        throw e
    }
    const entry = await Database.retrieve('agent', id)
    if (entry.state !== 'started') throw new Error('agent has not started')
    const info = await fromContainer(id, 'GET', '/')
    const recipe = Object.assign({}, info.recipe, recipeChanges)
    return fromContainer(id, 'PATCH', '/', recipe)
}

export async function list() {
    const entries = await Database.retrieveAll('agent', true)
    const withDescriptions = entries.map(entry => {
        if (entry.state !== 'started') return entry
        else return fromContainer(entry.id, 'GET', '/')
            .then(description => Object.assign(entry, description))
            .catch(e => Object.assign(entry, { state: 'unresponsive' }))
    })
    return Promise.all(withDescriptions)
}

export async function listRecipes() {
    const agents = await list()
    return agents.filter(agent => agent.state === 'started').map(agent => agent.recipe)
}

export async function destroy(id) {
    const agent = await Database.retrieve('agent', id)
    if (agent.state === 'starting') throw new Error('cannot destroy an agent until it has started')
    else if (agent.state === 'started') {
        const client = await Docker.client(agent.client)
        const container = client.getContainer(id)
        await container.stop()
        await container.remove()
        const image = client.getImage(id)
        await image.remove()
    }
    await Database.remove('build', id)
    return Database.remove('agent', id)
}

export function run(agent) {
    return fromContainer(agent, 'POST', '/')
}

export function getRuns(agent) {
    return fromContainer(agent, 'GET', '/runs')
}

export function getRun(agent, run) {
    return fromContainer(agent, 'GET', '/runs/' + run)
}

export function getRunExecution(agent, run) {
    return fromContainer(agent, 'GET', '/runs/' + run + '/execution')
}

export async function getRunData(agent, run, asCSV) {
    const data = await fromContainer(agent, 'GET', '/runs/' + run + '/data')
    return asCSV ? ToCSV(data) : data
}

export async function getDiffAdded(agent, run, asCSV) {
    const data = await fromContainer(agent, 'GET', '/runs/' + run + '/diff')
    return asCSV ? ToCSV(data.added) : data.added
}

export async function getDiffRemoved(agent, run, asCSV) {
    const data = await fromContainer(agent, 'GET', '/runs/' + run + '/diff')
    return asCSV ? ToCSV(data.removed) : data.removed
}

function validate(recipe, isUpdate) {
    const schema = {
        type: 'object',
        properties: {
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            setup: { type: 'array', items: { type: 'string' } },
            schedule: { type: 'string' },
            run: { type: 'array', minimum: 1, items: { type: 'string' } },
            result: { type: 'string', minLength: 1 },
            triggers: { type: 'array', items: { type: 'object', properties: { recipient: { type: 'string' } }, required: [ 'recipient' ] } }
        }
    }
    if (!isUpdate) schema.required = [ 'name', 'description', 'setup', 'schedule', 'run', 'result', 'triggers' ]
    const validation = new JsonSchema.Validator().validate(recipe, schema)
    return validation.errors.map(e => e.stack)
}

async function build(agent) {
    const builtDate = new Date().toISOString()
    try {
        const client = await Docker.client()
        const clientInfo = await client.info()
        const context = await buildContext(client, agent.id, agent.recipe)
        const image = await buildImage(client, agent.id, context)
        const container = await client.createContainer({ name: agent.id, Image: image.id })
        await container.start()
        const agentStarted = {
            state: 'started',
            builtDate,
            client: clientInfo.ID
        }
        Database.update('agent', agent.id, agentStarted, agent.rev)
    }
    catch (e) {
        const agentFailed = {
            state: 'failed',
            builtDate,
            recipe: agent.recipe
        }
        console.error(e.stack)
        Database.update('agent', agent.id, agentFailed, agent.rev)
    }
}

async function buildContext(client, id, recipe) {
    const packages = [ 'build-base', 'git', 'curl', 'wget', 'bash', 'python2', 'py2-pip', 'python3', 'ruby', 'nodejs-current' ]
    const dockerfile = 'FROM alpine:3.5'
          + '\n' + 'RUN apk add -q --no-cache ' + packages.join(' ')
          + '\n' + 'COPY runner /runner'
          + '\n' + 'WORKDIR /runner'
          + '\n' + 'RUN npm install --silent'
          + '\n' + `RUN node Start setup ${id}.json`
          + '\n' + `CMD node Start serve ${id}.json`
    const tar = Promisify(TarStream.pack())
    const files = await Promisify(Glob)('../runner/*(package.json|config.json|**.js)')
    const entries = files.map(filename => {
        return Promisify(FS.readFile)(filename).then(contents => tar.entry({ name: 'runner/' + Path.basename(filename) }, contents))
    })
    await Promise.all(entries)
    await tar.entry({ name: `runner/${id}.json` }, JSON.stringify(recipe))
    await tar.entry({ name: 'Dockerfile' }, dockerfile)
    tar.finalize()
    return tar
}

async function buildImage(client, id, tar) {
    const stream = await client.buildImage(tar, { t: id })
    var   log = []
    const logCreation = await Database.add('build', id, { log })
    var   logRevision = logCreation.rev
    const logUpdate = () => {
        Database.update('build', id, { log }, logRevision).then(update => logRevision = update.rev)
    }
    const logUpdater = setInterval(logUpdate, 1 * 1000) // in milliseconds
    return new Promise((resolve, reject) => {
        const handler = event => {
            if (event.stream) log.push({ type: 'stdout', value: StripAnsi(event.stream) })
            else if (event.error) log.push({ type: 'stderr', value: event.error })
            if (event.stream && event.stream.startsWith('Successfully built')) {
                clearInterval(logUpdater)
                logUpdate()
                resolve({ id: event.stream.match(/built (.*)\n/)[1], log })
            }
            else if (event.error || event.timeout) {
                clearInterval(logUpdater)
                logUpdate()
                event.error ? reject(event.error) : reject()
            }
        }
        const parser = new JsonStream() // deals with (large) json objects split over multiple events
        parser.on('data', handler)
        parser.on('error', error => handler({ error, log }))
        parser.on('end', () => handler({ error: 'Exited' }))
        stream.pipe(parser)
        setTimeout(() => handler({ timeout: true }), 30 * 60 * 1000) // in milliseconds
    })
}

async function fromContainer(id, method, path, data) {
    const agent = await Database.retrieve('agent', id)
    const client = await Docker.client(agent.client)
    const container = await client.getContainer(id)
    const command = ['curl', '-X', method, '-H', 'Content-Type: application/json', '-m', '5']
          .concat(data ? ['-d', JSON.stringify(data)] : [])
          .concat(['localhost:3000' + path])
    const exec = await container.exec({ Cmd: command, AttachStdin: true, AttachStdout: true })
    const stream = await exec.start()
    return new Promise((resolve, reject) => {
        var response = ''
        const parser = new Stream.PassThrough()
        parser.on('data', data => response += data)
        parser.on('error', reject)
        container.modem.demuxStream(stream, parser, parser)
        stream.on('end', () => {
            if (response === '' && method === 'GET') reject()
            else if (response === '') resolve()
            else {
                const data = JSON.parse(response)
                if (data.error) reject(new Error(data.error))
                else resolve(data)
            }
        })
    })
}
