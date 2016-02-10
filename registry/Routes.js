'use strict'

import Express from 'express'
import BodyParser from 'body-parser'
import * as Database from './Database'
import * as Agents from './Agents'
import Config from './config.json'

export function listen() {
    const app = Express()
    app.use(BodyParser.json())
    app.get('/agents', (request, response) => {
        Database.retrieveAll('agent')
            .then(agents => response.status(200).send(agents))
            .catch(e => response.status(500).send(e.message))
    })
    app.post('/agents', (request, response) => {
        run(request.body)
            .catch(e => response.status(500).send(e.message))
        response.status(202).send()
    })
    app.get('/agents/:id', (request, response) => {
        Database.retrieve('agent', request.params.id)
            .then(agent => response.status(200).send(agent))
            .catch(e => response.status(500).send(e.message))
    })
    app.delete('/agents/:id', (request, response) => {
        remove(request.params.id)
            .then(() => response.status(200).send())
            .catch(e => response.status(500).send(e.message))
    })
    app.get('/agents/:id/build', (request, response) => {
	Database.retrieve('build', request.params.id)
	    .then(agent => response.status(200).send(agent))
            .catch(e => response.status(500).send(e.message))
    })
    app.listen(Config.port)
}

async function run(recipe) {
    return Agents.create(recipe) // todo validate recipe json first
}

async function remove(id) {
    return Agents.destroy(id)
}
