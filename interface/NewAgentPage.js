import React from 'react'
import Page from 'page'
import CronEntry from 'CronEntry.js'
import CommandEntry from 'CommandEntry.js'
import AlertEntry from 'AlertEntry.js'
import HTTP from 'HTTP.js'

export default class AgentsPage extends React.Component {

    constructor() {
        super()
        this.set = this.set.bind(this)
        this.create = this.create.bind(this)
        const recipe = {
            name: '',
            description: '',
            location: '',
            updatable: true,
            schedule: '0 1 * * *',
            setup: [],
            run: [],
            result: '',
            alerts: []
        }
        this.state = { loading: false, recipe }
    }

    set(field) {
        return event => {
            const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
            this.setState({ recipe: Object.assign(this.state.recipe, { [field]: value }) })
        }
    }

    create() {
        this.setState({ loading: true })
        const registry = 'http://localhost:8000' // todo extract to config
        HTTP.post(registry + '/agents', this.state.recipe, (e, response) => {
            if (!e) Page('/agents/' + response.id)
        })
    }

    render() {
        if (this.state.loading) return React.DOM.div({ className: 'new-agent page' }, React.DOM.div({ className: 'loading' }))
        const elements = [
            React.DOM.h2({}, 'Create a new agent'),
            React.DOM.hr({}),
            React.DOM.h4({}, 'Agent name'),
            React.DOM.input({ onChange: this.set('name') }),
            React.DOM.h4({}, 'Description'),
            React.DOM.input({ onChange: this.set('description') }),
            React.DOM.hr({}),
            React.DOM.h4({}, 'Git repository'),
            React.DOM.input({ onChange: this.set('location') }),
            React.DOM.label({ className: 'toggle' }, React.DOM.h4({}, 'Update to the latest version before running?'), React.DOM.input({ type: 'checkbox', defaultChecked: this.state.recipe.updatable, onChange: this.set('updatable') })),
            React.DOM.hr({}),
            React.DOM.h4({}, 'How often should this agent run?'),
            React.createElement(CronEntry, { defaultValue: this.state.recipe.schedule, onChange: this.set('schedule') }),
            React.DOM.hr({}),
            React.DOM.h4({}, 'Setup commands'),
            React.createElement(CommandEntry, { onChange: this.set('setup') }),
            React.DOM.p({}, 'These commands will only be executed once, when the agent is being built.'),
            React.DOM.hr({}),
            React.DOM.h4({}, 'Run commands'),
            React.createElement(CommandEntry, { onChange: this.set('run') }),
            React.DOM.p({}, 'These commands will be executed every time the agent runs.'),
            React.DOM.h4({}, 'What file gets created?'),
            React.DOM.input({ onChange: this.set('result') }),
            React.DOM.hr({}),
            React.DOM.h4({}, 'Who should be alerted?'),
            React.createElement(AlertEntry, { onChange: this.set('alerts') }),
            React.DOM.hr({}),
            React.DOM.button({ onClick: this.create }, 'Create agent')
        ]
        return React.DOM.div({ className: 'new-agent page' }, ...elements)
    }

}
