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
    const id = recipe.name.replace(/ /g, '-').toLowerCase()
    const stored = await Database.add('agent', id, { state: 'starting', recipe })
    const client = await Docker.client()
    const clientInfo = await client.info()
    build(client, clientInfo, stored, recipe) // runs in background
    return { id: stored.id }
}

function validate(recipe) {
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
        },
        required: [ 'name', 'description', 'setup', 'schedule', 'run', 'result', 'triggers' ]
    }
    const validation = new JsonSchema.Validator().validate(recipe, schema)
    return validation.errors.map(e => e.stack)
}

async function build(client, clientInfo, stored, recipe) {
    try {
        const context = await buildContext(client, stored.id, recipe)
        const image = await buildImage(client, stored.id, context)
        const container = await client.createContainer({ name: stored.id, Image: image.id })
        await container.start()
        const agent = {
            state: 'started',
            recipe,
            client: clientInfo.ID
        }
        Database.update('agent', stored.id, agent, stored.rev)
    }
    catch (e) {
        console.log(e.stack ? e.stack : e)
        const agent = {
            state: 'failed',
            recipe,
            client: clientInfo.ID
        }
        Database.update('agent', stored.id, agent, stored.rev)
    }
}

async function buildContext(client, id, recipe) {
    const dockerfile = 'FROM node:5'
          + '\n' + 'COPY runner /runner'
          + '\n' + 'WORKDIR /runner'
          + '\n' + 'RUN npm install --quiet'
          + '\n' + `CMD node Start ${id}.json`
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
            if (event.stream) log.push({ text: StripAnsi(event.stream) })
            else log.push(event)
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
        stream.pipe(parser)
        setTimeout(() => handler({ timeout: true }), 30 * 60 * 1000) // in milliseconds
    })
}

async function fromContainer(id, path) {
    const agent = await Database.retrieve('agent', id)
    const client = await Docker.client(agent.client)
    const container = await client.getContainer(id)
    const exec = await container.exec({ Cmd: ['curl', 'localhost:3000' + path], AttachStdin: true, AttachStdout: true })
    const stream = await exec.start()
    return new Promise((resolve, reject) => {
        const parser = new Stream.PassThrough()
        var response = ''
        parser.on('data', data => response += data)
        parser.on('error', reject)
        container.modem.demuxStream(stream, parser, parser)
        stream.on('end', () => resolve(response))
    })
}

export async function getSetup(id) {
    return fromContainer(id, '/setup')
}

export async function getRuns(id) {
    return fromContainer(id, '/runs')
}

export async function destroy(id) {
    const agent = await Database.retrieve('agent', id)
    if (agent.state === 'starting') throw new Error('cannot destroy an agent until it has started')
    const client = await Docker.client(agent.client)
    const container = client.getContainer(id)
    await container.stop()
    await container.remove()
    const image = client.getImage(id)
    await image.remove()
    return Database.remove('agent', id)
}
