'use strict'

import Nodemailer from 'nodemailer'
import Config from './config.json'

export function format(diff, name) {
    function table(data) {
        if (data.length === 0) return '(None.)'
        return '<table>'
             + '<thead><tr>' + Object.keys(data[0]).map(key => '<td><strong>' + key + '</strong></td>').join('') + '</tr></thead>'
             + data.map(d => '<tr>' + Object.keys(d).map(key => '<td>' + d[key] + '</td>').join('') + '</tr>').join('')
             + '</table>'
    }
    return `<h1>${name}</h1>` + '<h2>Added</h2>' + table(diff.added) + '<h2>Removed</h2>' + table(diff.removed)
}

export async function send(recipient, name, text) {
    const message = {
        from: 'Newsagent <' + Config.email.from + '>',
        to: recipient,
        subject: '[ALERT] ' + name,
        html: text
    }
    const sent = await Nodemailer.createTransport(Config.email).sendMail(message)
    return { type: 'email', recipient, status: sent.response }
}
