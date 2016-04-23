import React from 'react'
import AgentInput from '/AgentInput.js'
import CronEntry from '/CronEntry.js'
export default class NewAgentPage extends React.Component {

    render() {
        const title = React.DOM.h2({}, 'Create a new agent')
        const hr = React.DOM.hr({})
        const input = React.createElement(AgentInput, {})
        return React.DOM.div({ className: 'new-agent page' }, title, hr, input)
    }

}







