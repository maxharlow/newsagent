import React from 'react'
import Page from 'page'
import PrettyCron from 'prettycron'
import HTTP from '/HTTP.js'
import Config from '/config.js'

export default class AgentsPage extends React.Component {

    constructor() {
        super()
        this.create = this.create.bind(this)
        this.filter = this.filter.bind(this)
        this.load = this.load.bind(this)
        this.state = {
            filter: '',
            agentsFiltered: [],
            agents: []
        }
    }

    componentWillMount() {
        this.load()
    }

    componentWillReceiveProps() {
        this.load()
    }

    componentWillUnmount() {
        if (this.state && this.state.timeout) clearTimeout(this.state.timeout)
    }

    load() {
        HTTP.get(Config.registry + '/agents').then(response => {
            const timeout = setTimeout(this.load, 1 * 1000) // in seconds
            this.setState({ agents: response, agentsFiltered: response, timeout })
        })
    }

    create() {
        Page('/new-agent')
    }

    filter(event) {
        const agents = this.state.agents.filter(agent => {
            return agent.recipe.name.toLowerCase().indexOf(event.target.value.toLowerCase()) >= 0
        })
        this.setState({ agentsFiltered: agents })
    }

    render() {
        const title = React.DOM.h2({}, 'Dashboard')
        const hr = React.DOM.hr({})
        const create = React.DOM.button({ onClick: this.create }, 'Create new agent')
        if (this.state === null) {
            const loading = React.DOM.div({ className: 'loading' })
            return React.DOM.div({ className: 'agents-page' }, create, title, hr, loading)
        }
        else if (this.state.agents.length === 0) {
            const message = React.DOM.p({}, 'No agents have been created.')
            return React.DOM.div({ className: 'agents-page' }, create, title, hr, message)
        }
        else {
            const filter = React.DOM.input({ placeholder: 'Filter agents...', className: 'filter', onInput: this.filter })
            const agents = this.state.agentsFiltered.map(agent => {
                const schedule = agent.recipe.schedule === '' ? '' : PrettyCron.toString(agent.recipe.schedule).toLowerCase()
                const fields = [
                    React.DOM.div({ className: 'state ' + agent.state }, agent.state),
                    React.DOM.div({ className: 'schedule' }, schedule),
                    React.DOM.h5({}, agent.recipe.name),
                    React.DOM.div({ className: 'description' }, agent.recipe.description)
                ]
                return React.DOM.li({ className: agent.state }, React.DOM.a({ href: '/agents/' + agent.id }, ...fields))
            })
            const list = React.DOM.ol({}, ...agents)
            return React.DOM.div({ className: 'agents-page' }, create, filter, title, hr, list)
        }
    }

}
