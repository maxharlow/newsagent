'use strict'

import PouchDB from 'pouchdb'
import Config from './config.json'

const db = new PouchDB(Config.pouchLocation)

export async function add(type, id, data) {
    return db.put({ _id: type + '/' + id, data })
}

export async function addWithTimestamp(type, id, data) {
    return db.put({ _id: type + '/' + id + '/' + new Date().toISOString(), data })
}

export async function retrieve(type, id) {
    const item = await db.get(type + '/' + id)
    return item.data
}

export async function retrieveAll(type) {
    const documents = await db.allDocs({ startkey: type + '/\uffff', endkey: type + '/', include_docs: true, descending: true })
    return documents.rows.map(row => {
        return Object.assign({ id: row.id.replace(type + '/', '') }, row.doc.data)
    })
}
