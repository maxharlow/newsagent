import React from 'react'
import AgentsList from '/AgentsList.js'

export default class AgentsPage extends React.Component {

    render() {
        const title = React.DOM.h2({}, 'All agents')
        const hr = React.DOM.hr({})
        const list = React.createElement(AgentsList, {})
        return React.DOM.div({ className: 'agents page' }, title, hr, list)
    }

}
