'use strict'

import PouchDB from 'pouchdb'
import Config from './config.json'

const db = new PouchDB(Config.pouchLocation)

export function add(type, id, data) {
    return db.put({ _id: type + '/' + id, data })
}

export async function remove(type, id) {
    const document = await db.get(type + '/' + id)
    return db.remove(document)
}

export async function retrieve(type, id) {
    const item = await db.get(type + '/' + id)
    return item.data
}

export async function retrieveAll(type, includeIDs) {
    const documents = await db.allDocs({ startkey: type + '/\uffff', endkey: type + '/', include_docs: true, descending: true })
    return documents.rows.map(row => {
        if (includeIDs === true) return Object.assign({ id: row.id.replace(type + '/', '') }, row.doc.data)
        else return row.doc.data
    })
}
