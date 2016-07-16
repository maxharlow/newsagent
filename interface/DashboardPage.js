import React from 'react'
import Page from 'page'
import PrettyCron from 'prettycron'
import HTTP from '/HTTP.js'
import Config from '/Config.js'

export default class AgentsPage extends React.Component {

    constructor() {
        super()
        this.create = this.create.bind(this)
        this.import = this.import.bind(this)
        this.export = this.export.bind(this)
        this.doFilter = this.doFilter.bind(this)
        this.onFilter = this.onFilter.bind(this)
        this.load = this.load.bind(this)
        this.state = {
            filter: '',
            agentsFiltered: [],
            agents: null
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
            this.setState({ agents: response, agentsFiltered: this.doFilter(response, this.state.filter), timeout })
        })
    }

    create() {
        Page('/new-agent')
    }

    import() {
        const input = document.createElement('input')
        input.setAttribute('type', 'file')
        input.setAttribute('accept', 'application/json')
        input.addEventListener('change', eventInput => {
            const file = eventInput.target.files[0]
            const fileReader = new FileReader()
            fileReader.addEventListener('load', eventRead => {
                const data = JSON.parse(eventRead.target.result)
                HTTP.post(Config.registry + '/import', [], data)
            })
            fileReader.readAsText(file)
        })
        input.click()
    }

    export() {
        HTTP.get(Config.registry + '/export').then(response => {
            const blob = new Blob([JSON.stringify(response)], { type: 'data:application/json;charset=utf-8,' })
            const anchor = document.createElement('a')
            anchor.setAttribute('href', URL.createObjectURL(blob))
            anchor.setAttribute('download', 'datastash-export.json')
            document.body.appendChild(anchor)
            anchor.click()
        })
    }

    doFilter(agents, value) {
        return agents.filter(agent => {
            return agent.recipe.name.toLowerCase().indexOf(value.toLowerCase()) >= 0
        })
    }

    onFilter(event) {
        const agents = this.doFilter(this.state.agents, event.target.value)
        this.setState({ filter: event.target.value, agentsFiltered: agents })
    }

    render() {
        const title = React.DOM.h2({}, 'Dashboard')
        const hr = React.DOM.hr({})
        const createButton = React.DOM.button({ onClick: this.create }, 'Create new agent')
        const importButton = React.DOM.button({ onClick: this.import }, 'Import')
        const exportButton = React.DOM.button({ onClick: this.export }, 'Export')
        if (this.state.agents === null) {
            const buttons = React.DOM.div({ className: 'buttons' }, importButton, createButton)
            const loading = React.DOM.div({ className: 'loading' })
            return React.DOM.div({ className: 'dashboard-page' }, title, buttons, hr, loading)
        }
        else if (this.state.agents.length === 0) {
            const buttons = React.DOM.div({ className: 'buttons' }, importButton, createButton)
            const message = React.DOM.p({}, 'No agents have been created.')
            return React.DOM.div({ className: 'dashboard-page' }, title, buttons, hr, message)
        }
        else {
            const count = React.DOM.span({ className: 'count' }, this.state.agentsFiltered.length === 1 ? '1 agent' : this.state.agentsFiltered.length + ' agents')
            const filter = React.DOM.input({ placeholder: 'Filter agents...', className: 'filter', onInput: this.onFilter })
            const buttons = React.DOM.div({ className: 'buttons' }, exportButton, importButton, createButton)
            const agents = this.state.agentsFiltered.map(agent => {
                const fields = [
                    agent.state === 'started' && agent.recipe.schedule
                        ? React.DOM.div({ className: 'schedule' }, 'runs at ' + PrettyCron.toString(agent.recipe.schedule).toLowerCase()) : '',
                    agent.state === 'started' ? '' : React.DOM.div({ className: 'state ' + agent.state }, agent.state),
                    React.DOM.h5({}, agent.recipe.name),
                    React.DOM.div({ className: 'description' }, agent.recipe.description)
                ]
                return React.DOM.li({ className: agent.state }, React.DOM.a({ href: '/agents/' + agent.id }, ...fields))
            })
            const list = React.DOM.ol({}, ...agents)
            return React.DOM.div({ className: 'dashboard-page' }, title, buttons, hr, filter, count, list)
        }
    }

}
