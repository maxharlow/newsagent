'use strict'

import PouchDB from 'pouchdb'
import Config from './config.json'

const db = new PouchDB(Config.pouchLocation)

export async function store(type, id, data) {
    return db.put({ _id: type + '/' + id + '/' + new Date().toISOString(), data })
}

export async function retrieveAll(type, id) {
    const response = await db.allDocs({ startkey: type + '/' + id + '/\uffff', endkey: type + '/' + id + '/', include_docs: true, descending: true, limit: 2 })
    return {
        current: response.rows[0].doc.data,
        currentDate: response.rows[0].id.split('/')[1],
        previous: response.rows[1] ? response.rows[1].doc.data : undefined,
        previousDate: response.rows[1] ? response.rows[1].id.split('/')[1] : undefined
    }
}
