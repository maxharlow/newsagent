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
    if (includeRev) return Object.assign({ rev: document._rev }, document.data)
    else return document.data
}

export async function retrieveAll(type, includeIDs) {
    const documents = await db.allDocs({ startkey: type + '/\uffff', endkey: type + '/', include_docs: true, descending: true })
    return documents.rows.map(row => {
        if (includeIDs === true) return Object.assign({ id: row.id.replace(type + '/', '') }, row.doc.data)
        else return row.doc.data
    })
}

export async function remove(type, id) {
    const document = await db.get(type + '/' + id)
    return db.remove(document)
}
