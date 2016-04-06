'use strict'

import Express from 'express'
import * as Database from './Database'
import Config from './config.json'

export function listen() {
    const app = Express()
    app.get('/setup', (request, response) => {
        Database.retrieve('log', 'setup')
            .then(setup => response.status(200).send(setup))
            .catch(e => {
                if (e.message === 'missing') response.status(404).send({ error: 'runner setup not found' })
                else response.status(500).send({ error: e.message })
            })
    })
    app.get('/runs', (request, response) => {
        Database.retrieveAll('log/run')
            .then(runs => response.status(200).send(runs))
            .catch(e => {
                console.log(e.stack)
                response.status(500).send({ error: e.message })
            })
    })
    app.listen(Config.port)
}
