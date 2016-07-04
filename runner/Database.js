'use strict'

import PouchDB from 'pouchdb'
import Config from './config.json'

const db = new PouchDB(Config.pouchLocation)

export function add(type, id, data) {
    return db.put({ _id: type + '/' + id, data })
}

export function update(type, id, data, rev) {
    return db.put({ _id: type + '/' + id, _rev: rev, data })
}

export async function retrieve(type, id, includeRev) {
    const document = await db.get(type + '/' + id)
    const withRev = includeRev ? { rev: document._rev } : {}
    return Object.assign(withRev, document.data)
}

export async function retrieveAll(type, includeIDs) {
    const documents = await db.allDocs({ startkey: type + '/\uffff', endkey: type + '/', include_docs: true, descending: true })
    return documents.rows.map(row => {
        const withIDs = includeIDs ? { id: row.id.replace(type + '/', '') } : {}
        return Object.assign(withIDs, row.doc.data)
    })
}

export async function remove(type, id) {
    const document = await db.get(type + '/' + id)
    return db.remove(document)
}
