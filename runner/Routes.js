'use strict'

import Express from 'express'
import BodyParser from 'body-parser'
import * as Runner from './Runner'
import * as Database from './Database'
import Config from './config.json'

export function listen() {
    const app = Express()
    app.use(BodyParser.json())
    app.get('/', (request, response) => {
        Runner.describe()
            .then(summary => response.status(200).send(summary))
            .catch(e => response.status(500).send({ error: e.message }))
    })
    app.post('/', (request, response) => {
        Runner.enqueue('manual')
            .then(() => response.status(202).send())
            .catch(e => {
                if (e.message === 'duplicate') response.status(403).send({ error: 'an identical run is already queued' })
                else response.status(500).send({ error: e.message })
            })
    })
    app.patch('/', (request, response) => {
        Runner.modify(request.body)
            .then(() => response.status(204).send())
            .catch(e => response.status(500).send({ error: e.message }))
    })
    app.get('/runs', (request, response) => {
        Database.retrieveAll('run', true)
            .then(runs => response.status(200).send(runs))
            .catch(e => response.status(500).send({ error: e.message }))
    })
    app.get('/runs/:id', (request, response) => {
        Runner.describeRun(request.params.id)
            .then(run => response.status(200).send(run))
            .catch(e => response.status(500).send({ error: e.message }))
    })
    app.get('/runs/:id/execution', (request, response) => {
        Database.retrieve('execution', request.params.id)
            .then(execution => response.status(200).send(execution.results))
            .catch(e => response.status(500).send({ error: e.message }))
    })
    app.get('/runs/:id/data', (request, response) => {
        Database.retrieve('data', request.params.id)
            .then(data => response.status(200).send(data.rows))
            .catch(e => response.status(500).send({ error: e.message }))
    })
    app.get('/runs/:id/diff', (request, response) => {
        Runner.difference(request.params.id)
            .then(diff => response.status(200).send(diff))
            .catch(e => response.status(500).send({ error: e.message }))
    })
    app.listen(Config.port)
}
