import React from 'react'
import HTTP from 'HTTP.js'
import Config from 'Config.js'

export default class AgentsList extends React.Component {

    constructor() {
        super()
        this.update = this.update.bind(this)
        this.state = { agents: [] }
    }

    update() {
        this.setState({ loading: true })
        HTTP.get(Config.registry + '/agents', (e, response) => {
            if (!e) this.setState({ agents: response, loading: false })
        })
    }

    componentWillMount() {
        this.update()
    }

    componentWillReceiveProps() {
        this.update()
    }

    render() {
        if (this.state.loading) return React.DOM.div({ className: 'loading' })
        if (this.state.agents.length > 0) {
            const body = this.state.agents.map(agent => {
                const columnName = React.DOM.a({ href: '/agents/' + agent.id }, React.DOM.h5({}, agent.recipe.name), React.DOM.p({}, agent.recipe.description))
                const columnState = agent.state === 'started' ? '' : React.DOM.a({ href: '/agents/' + agent.id }, agent.state)
                return React.DOM.tr({}, React.DOM.td({ className: 'name' }, columnName), React.DOM.td({ className: 'state' }, columnState))
            })
            return React.DOM.table({}, React.DOM.tbody({}, ...body))
        }
        else return React.DOM.p({}, 'No agents have been created.')
    }

}
