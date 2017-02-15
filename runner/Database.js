'use strict'

import PouchDB from 'pouchdb'
import Config from './config.json'

const db = new PouchDB(Config.pouchLocation)

export function add(type, id, data) {
    return db.put({ _id: type + '/' + id, data })
}

export function addSet(type, id, data) {
    const documents = data.map((item, i) => ({ _id: type + '/' + id + '/' + i, data: item }))
    return db.bulkDocs(documents)
}

export function update(type, id, data, rev) {
    return db.put({ _id: type + '/' + id, _rev: rev, data })
}

export async function retrieve(type, id, includeRev) {
    const document = await db.get(type + '/' + id)
    const withRev = includeRev ? { rev: document._rev } : {}
    return Object.assign(withRev, document.data)
}

export async function retrieveSet(type, id) {
    const documents = await db.allDocs({ startkey: type + '/' + id + '/\uffff', endkey: type + '/' + id + '/', include_docs: true, descending: true })
    return documents.rows.map(row => row.doc.data)
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

export async function removeSet(type, id) {
    const documents = await retrieveSet(type, id)
    const removals = documents.map(db.remove)
    return Promise.all(removals)
}
