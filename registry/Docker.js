'use strict'

import FS from 'fs'
import Path from 'path'
import Dockerode from 'dockerode-promise'
import Config from './config.json'

var dockers

async function load() {
    const clients = Config.dockerHosts.map(host => {
        const options = {
            host: host.host,
            port: host.port,
            ca: FS.readFileSync(Path.join(host.certPath, 'ca.pem')),
            cert: FS.readFileSync(Path.join(host.certPath, 'cert.pem')),
            key: FS.readFileSync(Path.join(host.certPath, 'key.pem'))
        }
        return new Dockerode(options)
    })
    const infos = await Promise.all(clients.map(client => client.info()))
    return infos.map((info, i) => ({ id: info.ID, client: clients[i] }))
}

export async function client(id) {
    if (!dockers) dockers = await load()
    if (id) {
        const docker = dockers.find(c => c.id === id)
        if (docker) return docker.client
        else throw new Error('client not found')
    }
    else return dockers[0].client // todo select the one with least load
}
