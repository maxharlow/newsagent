import React from 'react'
import Dialog from 'Dialog.js'
import HTTP from 'HTTP.js'

export default class AgentPageDeletion extends React.Component {

    constructor() {
        super()
        this.state = { confirming: false }
        this.deletion = this.deletion.bind(this)
    }

    deletion() {
        const registry = 'http://localhost:8000' // todo extract to config
        HTTP.delete(registry + '/agents/' + this.props.id)
        location.href = '/'
    }
    
    render() {
        const dialog = !this.state.confirming ? undefined : React.createElement(Dialog, {
            text: 'Are you sure you want to delete this agent?',
            acceptText: 'Delete agent',
            accept: this.deletion,
            cancel: () => this.setState({ confirming: false })
        })
        const button = React.DOM.button({ disabled: this.props.state !== 'started', onClick: () => this.setState({ confirming: true }) }, 'Delete')
        return React.DOM.div({ className: 'section deletion' }, React.DOM.h3({}, 'Delete this agent'), button, dialog)
    }
    
}
