'use strict'

import FS from 'fs'
import Path from 'path'
import Promisify from 'promisify-node'
import TarStream from 'tar-stream'
import Glob from 'glob'
import JsonSchema from 'jsonschema'
import JsonStream from 'jsonstream'
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
            name: { type: 'string' },
            description: { type: 'string' },
            setup: { type: 'array', items: { type: 'string' } },
            schedule: { type: 'string' },
            run: { type: 'array', minimum: 1, items: { type: 'string' } },
            result: { type: 'string' },
            triggers: { type: 'array', items: { type: 'object', properties: { recipient: { type: 'string' } }, required: [ 'recipient' ] } }
        },
        required: [ 'name', 'description', 'location', 'updatable', 'setup', 'schedule', 'run', 'result', 'triggers' ]
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
          + '\n' + 'COPY package.json /'
          + '\n' + 'COPY config.json /'
          + '\n' + 'COPY *.js /'
          + '\n' + `COPY ${id}.json /`
          + '\n' + 'RUN npm install'
          + '\n' + `CMD node Start ${id}.json`
    const tar = Promisify(TarStream.pack())
    const files = await Promisify(Glob)('../runner/*(package.json|config.json|**.js)')
    const entries = files.map(filename => {
        return Promisify(FS.readFile)(filename).then(contents => tar.entry({ name: Path.basename(filename) }, contents))
    })
    await Promise.all(entries)
    await tar.entry({ name: id + '.json' }, JSON.stringify(recipe))
    await tar.entry({ name: 'Dockerfile' }, dockerfile)
    tar.finalize()
    return tar
}

async function buildImage(client, id, tar) {
    const stream = await client.buildImage(tar, { t: id })
    var   log = []
    const logCreation = await Database.add('build', id, log)
    var   logRevision = logCreation.rev
    const logUpdate = () => {
        Database.update('build', id, log, logRevision).then(update => logRevision = update.rev)
    }
    const logUpdater = setInterval(logUpdate, 1 * 1000) // in milliseconds
    return new Promise((resolve, reject) => {
        const handler = event => {
	        if (event.stream) log.push({ text: StripAnsi(event.stream) })
	        else log.push(event)
            if (event.stream && event.stream.startsWith('Successfully built')) {
                parser.removeAllListeners()
                clearInterval(logUpdater)
                logUpdate()
                resolve({ id: event.stream.match(/built (.*)\n/)[1], log })
            }
            else if (event.error) {
                parser.removeAllListeners()
                clearInterval(logUpdater)
                logUpdate()
                reject(event.error)
            }
        }
        const parser = JsonStream.parse()
        parser.on('data', handler)
        parser.on('error', error => handler({ error, log }))
        stream.pipe(parser)
        setTimeout(() => handler({ error: 'Timed out' }), 30 * 60 * 1000) // in milliseconds
    })
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
