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
        response.header('Access-Control-Allow-Headers', 'Content-Type')
        response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
        next()
    })
    app.get('/agents', (request, response) => {
        Database.retrieveAll('agent')
            .then(agents => response.status(200).send(agents))
            .catch(e => response.status(500).send({ error: e.message }))
    })
    app.post('/agents', (request, response) => {
        Agents.create(request.body)
            .then(agent => response.status(202).send(agent))
            .catch(e => {
                if (e.validation) response.status(400).send({ error: e.message, detail: e.validation })
                else response.status(500).send({ error: e.message })
            })
    })
    app.get('/agents/:id', (request, response) => {
        Database.retrieve('agent', request.params.id)
            .then(agent => response.status(200).send(agent))
            .catch(e => {
                if (e.message === 'missing') response.status(404).send({ error: 'agent not found' })
                else response.status(500).send({ error: e.message })
            })
    })
    app.delete('/agents/:id', (request, response) => {
        Agents.destroy(request.params.id)
            .then(() => response.status(204).send())
            .catch(e => {
                if (e.message === 'missing') response.status(404).send({ error: 'agent not found' })
                else response.status(500).send({ error: e.message })
            })
    })
    app.get('/agents/:id/summary', (request, response) => {
        Agents.getSummary(request.params.id)
            .then(summary => response.status(200).send(summary))
            .catch(e => {
                if (e.message === 'missing') response.status(404).send({ error: 'agent summary not found' })
                else response.status(500).send({ error: e.message })
            })
    })
    app.get('/agents/:id/build', (request, response) => {
        Database.retrieve('build', request.params.id)
            .then(build => response.status(200).send({ id: build.id, log: build.log.slice(request.query.since || 0) }))
            .catch(e => {
                if (e.message === 'missing') response.status(404).send({ error: 'agent build not found' })
                else response.status(500).send({ error: e.message })
            })
    })
    app.get('/agents/:agent/runs', (request, response) => {
        Agents.getRuns(request.params.agent)
            .then(runs => response.status(200).send(runs))
            .catch(e => {
                if (e.message === 'missing') response.status(404).send({ error: 'agent runs not found' })
                else response.status(500).send({ error: e.message })
            })
    })
    app.get('/agents/:agent/runs/:run', (request, response) => {
        const asCSV = request.accepts(['application/json', 'text/csv']) === 'text/csv'
        Agents.getRunData(request.params.agent, request.params.run, asCSV)
            .then(data => {
                if (asCSV) response.append('Content-Type', 'text/csv')
                response.status(200).send(data)
            })
            .catch(e => {
                if (e.message === 'missing') response.status(404).send({ error: 'agent data not found' })
                else response.status(500).send({ error: e.message })
            })
    })
    app.listen(Config.port)
}
