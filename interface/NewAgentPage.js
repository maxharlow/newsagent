import React from 'react'
import Page from 'page'
import CronEntry from '/CronEntry.js'
import CommandEntry from '/CommandEntry.js'
import TriggerEntry from '/TriggerEntry.js'
import HTTP from '/HTTP.js'
import Config from '/Config.js'

export default class NewAgentPage extends React.Component {

    constructor() {
        super()
        this.set = this.set.bind(this)
        this.create = this.create.bind(this)
        const recipe = {
            name: '',
            description: '',
            schedule: '0 1 * * *',
            setup: [],
            run: [],
            result: '',
            triggers: []
        }
        this.state = { loading: false, validation: {}, recipe }
    }

    set(field) {
        return event => {
            const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
            this.setState({ recipe: Object.assign(this.state.recipe, { [field]: value }) })
        }
    }

    create() {
        const validation = {
            name: this.state.recipe.name === '',
            run: this.state.recipe.run.length === 0 || this.state.recipe.run[0] === '',
            result: this.state.recipe.result === ''
        }
        this.setState({ validation })
        const isValid = Object.keys(validation).every(key => validation[key] === false)
        if (!isValid) return
        this.setState({ loading: true })
        HTTP.post(Config.registry + '/agents', [], this.state.recipe)
            .then(response => Page('/agents/' + response.id))
            .catch(e => this.setState({ error: e.error }))
    }

    render() {
        const title = React.DOM.h2({}, 'Create a new agent')
        const hr = React.DOM.hr({})
        if (this.state.error) {
            const error = React.DOM.h2({}, 'Something went wrong')
            const info = React.DOM.p({}, 'An error occured whilst creating this agent.')
            const message = React.DOM.p({}, this.state.error)
            return React.DOM.div({ className: 'new-agent-page' }, title, hr, React.DOM.div({ className: 'error' }, error, info, message))
        }
        if (this.state.loading) return React.DOM.div({ className: 'new-agent-page' }, React.DOM.div({ className: 'loading' }))
        const elements = [
            this.state.validation['name'] ? React.DOM.span({ className: 'validation' }, 'You must give this agent a name') : null,
            React.DOM.h4({}, 'Agent name'),
            React.DOM.input({ onChange: this.set('name') }),
            React.DOM.h4({}, 'Description'),
            React.DOM.input({ onChange: this.set('description') }),
            React.DOM.hr({}),
            React.DOM.h4({}, 'Setup commands'),
            React.createElement(CommandEntry, { onChange: this.set('setup') }),
            React.DOM.p({}, 'These commands will only be executed once, when the agent is being built.'),
            React.DOM.hr({}),
            React.DOM.h4({}, 'When should this agent run?'),
            React.createElement(CronEntry, { defaultValue: this.state.recipe.schedule, onChange: this.set('schedule') }),
            this.state.validation['run'] ? React.DOM.span({ className: 'validation' }, 'At least one command needs to be entered') : null,
            React.DOM.h4({}, 'Run commands'),
            React.createElement(CommandEntry, { onChange: this.set('run') }),
            React.DOM.p({}, 'These commands will be executed every time the agent runs.'),
            this.state.validation['result'] ? React.DOM.span({ className: 'validation' }, 'You must give the name of the file that gets created by this agent') : null,
            React.DOM.h4({}, 'What file gets created?'),
            React.DOM.input({ onChange: this.set('result') }),
            React.DOM.hr({}),
            React.DOM.h4({}, 'What should happen next?'),
            React.createElement(TriggerEntry, { onChange: this.set('triggers') }),
            React.DOM.hr({}),
            React.DOM.button({ onClick: this.create }, 'Create agent')
        ]
        return React.DOM.div({ className: 'new-agent-page' }, title, hr, React.DOM.div({}, ...elements))
    }

}
