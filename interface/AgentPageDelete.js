import React from 'react'
import Page from 'page'
import Dialog from '/Dialog.js'
import HTTP from '/HTTP.js'
import Config from '/config.js'

export default class AgentPageDelete extends React.Component {

    constructor() {
        super()
        this.state = { confirming: false }
        this.deletion = this.deletion.bind(this)
    }

    deletion() {
        HTTP.delete(Config.registry + '/agents/' + this.props.id).then(() => Page('/'))
    }

    render() {
        const dialog = !this.state.confirming ? undefined : React.createElement(Dialog, {
            text: 'Are you sure you want to delete this agent?',
            acceptText: 'Delete agent',
            accept: this.deletion,
            cancel: () => this.setState({ confirming: false })
        })
        const button = React.DOM.button({ onClick: () => this.setState({ confirming: true }) }, 'Delete agent')
        return React.DOM.div({ className: 'agent-page-delete' }, button, dialog)
    }

}
