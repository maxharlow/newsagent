'use strict'

import Express from 'express'
import BodyParser from 'body-parser'
import * as Database from './Database'
import * as Agents from './Agents'
import Config from './config.json'

export function listen() {
    const app = Express()
    app.use(BodyParser.json())
    app.use((_, response, next) => {
        response.header('Access-Control-Allow-Origin', '*')
        next()
    })
    app.get('/agents', (request, response, next) => {
        Database.retrieveAll('agent')
            .then(agents => response.status(200).send(agents))
            .catch(e => response.status(500).send({ error: e.message }))
    })
    app.post('/agents', (request, response, next) => {
        const validationErrors = Agents.validate(request.body)
        if (validationErrors.length > 0) response.status(400).send({ error: 'recipe not valid', detail: validationErrors })
        else {
            Agents.create(request.body)
            response.status(202).send()
        }
    })
    app.get('/agents/:id', (request, response, next) => {
        Database.retrieve('agent', request.params.id)
            .then(agent => response.status(200).send(agent))
            .catch(e => {
                if (e.message === 'missing') response.status(404).send({ error: 'agent not found' })
                else response.status(500).send({ error: e.message })
            })
    })
    app.delete('/agents/:id', (request, response, next) => {
        Agents.destroy(request.params.id)
            .then(() => response.status(204).send())
            .catch(e => {
                if (e.message === 'missing') response.status(404).send({ error: 'agent not found' })
                else response.status(500).send({ error: e.message })
            })
    })
    app.get('/agents/:id/build', (request, response, next) => {
        Database.retrieve('build', request.params.id)
            .then(build => response.status(200).send(build))
            .catch(e => {
                if (e.message === 'missing') response.status(404).send({ error: 'agent not found' })
                else response.status(500).send({ error: e.message })
            })
    })
    app.listen(Config.port)
}
