import React from 'react'
import HTTP from '/HTTP.js'
import Config from '/config.js'

export default class AgentsList extends React.Component {

    constructor() {
        super()
        this.filter = this.filter.bind(this)
        this.update = this.update.bind(this)
        this.state = {
            filter: '',
            agentsFiltered: [],
            agents: []
        }
    }

    filter(event) {
        const agents = this.state.agents.filter(agent => {
            return agent.recipe.name.toLowerCase().indexOf(event.target.value.toLowerCase()) >= 0
        })
        this.setState({ agentsFiltered: agents })
    }

    update() {
        this.setState({ loading: true })
        HTTP.get(Config.registry + '/agents', (e, response) => {
            if (!e) this.setState({ agents: response, agentsFiltered: response, loading: false })
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
            const filter = React.DOM.input({ placeholder: 'Filter agents...', className: 'filter', onInput: this.filter })
            const tableRows = this.state.agentsFiltered.map(agent => {
                const columnName = React.DOM.a({ href: '/agents/' + agent.id }, React.DOM.h5({}, agent.recipe.name), React.DOM.p({}, agent.recipe.description))
                const columnState = agent.state === 'started' ? '' : React.DOM.a({ href: '/agents/' + agent.id }, agent.state)
                return React.DOM.tr({}, React.DOM.td({ className: 'name' }, columnName), React.DOM.td({ className: 'state' }, columnState))
            })
            const table = React.DOM.table({}, React.DOM.tbody({}, ...tableRows))
            return React.DOM.div({}, filter, table)
        }
        else return React.DOM.p({}, 'No agents have been created.')
    }

}
