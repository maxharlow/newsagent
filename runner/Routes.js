'use strict'

import Express from 'express'
import Morgan from 'morgan'
import BodyParser from 'body-parser'
import * as Runner from './Runner'
import * as Database from './Database'
import Config from './config.json'

export function listen() {
    const app = Express()
    app.use(Morgan(':date[iso] :response-time ms :method :status :url'))
    app.use(BodyParser.json())
    app.get('/', (request, response) => {
        Runner.describe()
            .then(summary => response.status(200).send(summary))
            .catch(e => {
                if (e && e.message) response.status(500).send({ error: e.message })
                else response.status(500).send({ error: 'unknown error' })
            })
    })
    app.post('/', (request, response) => {
        Runner.enqueue('manual')
            .then(() => response.status(202).send())
            .catch(e => {
                if (e && e.message === 'duplicate') response.status(403).send({ error: 'an identical run is already queued' })
                else if (e && e.message) response.status(500).send({ error: e.message })
                else response.status(500).send({ error: 'unknown error' })
            })
    })
    app.patch('/', (request, response) => {
        Runner.modify(request.body)
            .then(() => response.status(204).send())
            .catch(e => {
                if (e && e.message) response.status(500).send({ error: e.message })
                else response.status(500).send({ error: 'unknown error' })
            })
    })
    app.get('/runs', (request, response) => {
        Database.retrieveAll('run', true)
            .then(runs => response.status(200).send(runs))
            .catch(e => {
                if (e && e.message) response.status(500).send({ error: e.message })
                else response.status(500).send({ error: 'unknown error' })
            })
    })
    app.get('/runs/:id', (request, response) => {
        Runner.describeRun(request.params.id)
            .then(run => response.status(200).send(run))
            .catch(e => {
                if (e && e.message && e.message === 'missing') response.status(404).send({ error: 'not found' })
                else if (e && e.message) response.status(500).send({ error: e.message })
                else response.status(500).send({ error: 'unknown error' })
            })
    })
    app.get('/runs/:id/execution', (request, response) => {
        Database.retrieve('execution', request.params.id)
            .then(execution => response.status(200).send(execution.results))
            .catch(e => {
                if (e && e.message && e.message === 'missing') response.status(404).send({ error: 'not found' })
                else if (e && e.message) response.status(500).send({ error: e.message })
                else response.status(500).send({ error: 'unknown error' })
            })
    })
    app.get('/runs/:id/data', (request, response) => {
        Database.retrieveSet('data', request.params.id)
            .then(data => response.status(200).send(data))
            .catch(e => {
                if (e && e.message && e.message === 'missing') response.status(404).send({ error: 'not found' })
                else if (e && e.message) response.status(500).send({ error: e.message })
                else response.status(500).send({ error: 'unknown error' })
            })
    })
    app.get('/runs/:id/data/added', (request, response) => {
        Database.retrieveSet('data-added', request.params.id)
            .then(data => response.status(200).send(data))
            .catch(e => {
                if (e && e.message && e.message === 'missing') response.status(404).send({ error: 'not found' })
                else if (e && e.message) response.status(500).send({ error: e.message })
                else response.status(500).send({ error: 'unknown error' })
            })
    })
    app.get('/runs/:id/data/removed', (request, response) => {
        Database.retrieveSet('data-removed', request.params.id)
            .then(data => response.status(200).send(data))
            .catch(e => {
                if (e && e.message && e.message === 'missing') response.status(404).send({ error: 'not found' })
                else if (e && e.message) response.status(500).send({ error: e.message })
                else response.status(500).send({ error: 'unknown error' })
            })
    })
    app.listen(Config.port)
}
