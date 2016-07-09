import React from 'react'
import Page from 'page'
import Dialog from '/Dialog.js'
import HTTP from '/HTTP.js'
import Config from '/Config.js'

export default class AgentPageDelete extends React.Component {

    constructor() {
        super()
        this.state = { confirming: false }
        this.send = this.send.bind(this)
    }

    send() {
        HTTP.delete(Config.registry + '/agents/' + this.props.id).then(() => Page('/'))
    }

    render() {
        const dialog = !this.state.confirming ? undefined : React.createElement(Dialog, {
            body: React.DOM.h5({}, 'Are you sure you want to delete this agent?'),
            acceptText: 'Delete agent',
            accept: this.send,
            cancel: () => this.setState({ confirming: false })
        })
        const deleteButton = React.DOM.button({ onClick: () => this.setState({ confirming: true }) }, 'Delete')
        return React.DOM.div({ className: 'agent-page-delete' }, deleteButton, dialog)
    }

}
