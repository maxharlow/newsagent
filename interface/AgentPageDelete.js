import React from 'react'
import HTML from 'react-dom-factories'
import Page from 'page'
import Dialog from '/Dialog.js'
import Config from '/Config.js'

export default class AgentPageDelete extends React.Component {

    constructor() {
        super()
        this.state = { confirming: false }
        this.send = this.send.bind(this)
    }

    send() {
        const abort = error => {
            console.error('Could not delete agent', error)
        }
        fetch(Config.registry + '/agents/' + this.props.id, { method: 'DELETE' })
            .then(() => Page('/'))
            .catch(abort)
    }

    render() {
        const dialog = !this.state.confirming ? null : React.createElement(Dialog, {
            body: [ HTML.h5({}, 'Are you sure you want to delete this agent?') ],
            acceptText: 'Delete agent',
            accept: this.send,
            cancel: () => this.setState({ confirming: false })
        })
        const deleteButton = HTML.button({ onClick: () => this.setState({ confirming: true }) }, 'Delete')
        return HTML.div({ className: 'agent-page-delete' }, deleteButton, dialog)
    }

}
