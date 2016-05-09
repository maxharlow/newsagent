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
        this.update = this.update.bind(this)
        this.state = {
            filter: '',
            agentsFiltered: [],
            agents: []
        }
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
        const title = React.DOM.h2({}, 'Dashboard')
        const hr = React.DOM.hr({})
        const create = React.DOM.button({ onClick: this.create }, 'Create new agent')
        if (this.state.agents.length > 0) {
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
        else return React.DOM.div({ className: 'agents-page' }, create, title, hr, React.DOM.p({}, 'No agents have been created.'))
    }

}
