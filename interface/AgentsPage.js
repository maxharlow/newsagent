import React from 'react'
import PrettyCron from 'prettycron'
import HTTP from '/HTTP.js'
import Config from '/config.js'

export default class AgentsPage extends React.Component {

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
        HTTP.get(Config.registry + '/agents').then(response => {
            this.setState({ agents: response, agentsFiltered: response, loading: false })
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
        const title = React.DOM.h2({}, 'Agents')
        const hr = React.DOM.hr({})
        if (this.state.agents.length > 0) {
            const filter = React.DOM.input({ placeholder: 'Filter agents...', className: 'filter', onInput: this.filter })
            const tableRows = this.state.agentsFiltered.map(agent => {
                const rowNameFields = [
                    React.DOM.h5({}, agent.recipe.name),
                    React.DOM.p({}, agent.recipe.description),
                    React.DOM.span({}, PrettyCron.toString(agent.recipe.schedule).toLowerCase())
                ]
                const rowName = React.DOM.a({ href: '/agents/' + agent.id }, ...rowNameFields)
                const rowState = agent.state === 'started' ? '' : React.DOM.a({ href: '/agents/' + agent.id }, agent.state)
                return React.DOM.tr({}, React.DOM.td({ className: 'name' }, rowName), React.DOM.td({ className: 'state' }, rowState))
            })
            const table = React.DOM.table({}, React.DOM.tbody({}, ...tableRows))
            return React.DOM.div({ className: 'agents page' }, filter, title, hr, table)
        }
        else return React.DOM.div({ className: 'agents page' }, title, hr, React.DOM.p({}, 'No agents have been created.'))
    }

}
