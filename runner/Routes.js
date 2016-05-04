'use strict'

import Express from 'express'
import * as Database from './Database'
import Config from './config.json'

export function listen() {
    const app = Express()
    app.get('/runs', (request, response) => {
        Database.retrieveAll('run', true)
            .then(runs => response.status(200).send(runs))
            .catch(e => response.status(500).send({ error: e.message }))
    })
    app.get('/runs/:id', (request, response) => {
        Database.retrieve('data', request.params.id)
            .then(runs => response.status(200).send(runs))
            .catch(e => response.status(500).send({ error: e.message }))
    })
    app.listen(Config.port)
}
