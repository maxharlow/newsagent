import React from 'react'
import HTML from 'react-dom-factories'
import Page from 'page'
import PrettyCron from 'prettycron'
import Config from '/Config.js'

export default class DashboardPage extends React.Component {

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

    load() {
        const abort = error => {
            console.error('Could not load agents', error)
        }
        const update = response => {
            if (!this.node) return
            const timeout = setTimeout(this.load, 1 * 1000) // in milliseconds
            this.setState({ agents: response, agentsFiltered: this.doFilter(response, this.state.filter), timeout })
        }
        fetch(Config.registry + '/agents')
            .then(response => response.json())
            .then(update)
            .catch(abort)
    }

    create() {
        Page('/new-agent')
    }

    import() {
        const input = document.createElement('input')
        input.setAttribute('type', 'file')
        input.setAttribute('accept', 'application/json')
        input.setAttribute('style', 'display: none')
        input.addEventListener('change', eventInput => {
            const file = eventInput.target.files[0]
            const fileReader = new FileReader()
            fileReader.addEventListener('load', eventRead => {
                const data = JSON.parse(eventRead.target.result)
                const abort = error => {
                    console.error('Could not import agents', error)
                }
                fetch(Config.registry + '/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                    .catch(abort)
            })
            fileReader.readAsText(file)
        })
        document.body.appendChild(input)
        input.click()
    }

    export() {
        const abort = error => {
            console.error('Could not export agents', error)
        }
        const get = response => {
            const blob = new Blob([JSON.stringify(response)], { type: 'data:application/json;charset=utf-8,' })
            const anchor = document.createElement('a')
            anchor.setAttribute('href', URL.createObjectURL(blob))
            anchor.setAttribute('download', 'newsagent-export.json')
            document.body.appendChild(anchor)
            anchor.click()
        }
        fetch(Config.registry + '/export')
            .then(response => response.json())
            .then(get)
            .catch(abort)
    }

    doFilter(agents, value) {
        return agents.filter(agent => {
            return (value === '' && agent.state === 'unresponsive')
                || agent.recipe && agent.recipe.name.toLowerCase().indexOf(value.toLowerCase()) >= 0
        })
    }

    onFilter(event) {
        const agents = this.doFilter(this.state.agents, event.target.value)
        this.setState({ filter: event.target.value, agentsFiltered: agents })
    }

    render() {
        const title = HTML.h2({}, HTML.a({ href: '/' }, 'Agents'))
        const hr = HTML.hr({})
        const createButton = HTML.button({ onClick: this.create }, 'Create new agent')
        const importButton = HTML.button({ onClick: this.import }, 'Import')
        const exportButton = HTML.button({ onClick: this.export }, 'Export')
        if (this.state.agents === null) {
            const buttons = HTML.div({ className: 'buttons' }, importButton, createButton)
            const loading = HTML.div({ className: 'loading' })
            return HTML.div({ className: 'dashboard-page', ref: node => this.node = node }, title, buttons, hr, loading)
        }
        else if (this.state.agents.length === 0) {
            const buttons = HTML.div({ className: 'buttons' }, importButton, createButton)
            const message = HTML.p({}, 'No agents have been created.')
            return HTML.div({ className: 'dashboard-page', ref: node => this.node = node }, title, buttons, hr, message)
        }
        else {
            const count = HTML.span({ className: 'count' }, this.state.agentsFiltered.length === 1 ? '1 agent' : this.state.agentsFiltered.length + ' agents')
            const filter = HTML.input({ placeholder: 'Filter agents...', className: 'filter', onInput: this.onFilter })
            const buttons = HTML.div({ className: 'buttons' }, exportButton, importButton, createButton)
            const agents = this.state.agentsFiltered.map(agent => {
                const fields = [
                    agent.state === 'started' && agent.recipe.schedule
                        ? HTML.div({ className: 'schedule' }, 'runs at ' + PrettyCron.toString(agent.recipe.schedule).toLowerCase()) : null,
                    agent.state !== 'started'
                        ? HTML.div({ className: 'state ' + agent.state }, agent.state) : null,
                    HTML.h5({}, agent.recipe ? agent.recipe.name : '[' + agent.id + ']'),
                    HTML.div({ className: 'description' }, agent.recipe ? agent.recipe.description : null)
                ]
                const inner = agent.state !== 'unresponsive'
                      ? HTML.a({ href: '/agents/' + agent.id }, ...fields)
                      : HTML.span({}, ...fields)
                return HTML.li({ className: agent.state }, inner)
            })
            const list = HTML.ol({}, ...agents)
            return HTML.div({ className: 'dashboard-page', ref: node => this.node = node }, ...[
                title,
                buttons,
                hr,
                filter,
                count,
                list
            ])
        }
    }

}
