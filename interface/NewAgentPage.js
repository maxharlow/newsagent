import React from 'react'
import HTML from 'react-dom-factories'
import Page from 'page'
import CronEntry from '/CronEntry.js'
import CommandEntry from '/CommandEntry.js'
import TriggerEntry from '/TriggerEntry.js'
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
            key: '',
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
        const recipe = this.state.recipe.key !== '' // turn empty string into null
              ? this.state.recipe
              : Object.assign(this.state.recipe, { key: null })
        fetch(Config.registry + '/agents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipe)
        })
            .then(response => response.json())
            .then(response => Page('/agents/' + response.id))
            .catch(e => {
                if (!this.node) return
                this.setState({ error: e.error })
            })
    }

    render() {
        const title = HTML.h2({}, 'Create a new agent')
        const hr = HTML.hr({})
        if (this.state.error) {
            const error = HTML.h2({}, 'Something went wrong')
            const info = HTML.p({}, 'An error occured whilst creating this agent.')
            const message = HTML.p({}, this.state.error)
            return HTML.div({ className: 'new-agent-page', ref: node => this.node = node }, ...[
                title,
                hr,
                HTML.div({ className: 'error' }, error, info, message)
            ])
        }
        if (this.state.loading) return HTML.div({ className: 'new-agent-page', ref: node => this.node = node }, ...[
            HTML.div({ className: 'loading' })
        ])
        const elements = [
            this.state.validation['name'] ? HTML.span({ className: 'validation' }, 'You must give this agent a name') : null,
            HTML.h4({}, 'Agent name'),
            HTML.input({ onChange: this.set('name') }),
            HTML.h4({}, 'Description'),
            HTML.input({ onChange: this.set('description') }),
            HTML.hr({}),
            HTML.h4({}, 'Setup commands'),
            React.createElement(CommandEntry, { onChange: this.set('setup') }),
            HTML.p({}, 'These commands will only be executed once, when the agent is being built. Use ', HTML.code({}, 'requires'), ' to declare what packages are going to be used.'),
            HTML.hr({}),
            HTML.h4({}, 'When should this agent run?'),
            React.createElement(CronEntry, { defaultValue: this.state.recipe.schedule, onChange: this.set('schedule') }),
            this.state.validation['run'] ? HTML.span({ className: 'validation' }, 'At least one command needs to be entered') : null,
            HTML.h4({}, 'Run commands'),
            React.createElement(CommandEntry, { onChange: this.set('run') }),
            HTML.p({}, 'These commands will be executed every time the agent runs.'),
            this.state.validation['result'] ? HTML.span({ className: 'validation' }, 'You must give the name of the file that gets created by this agent') : null,
            HTML.h4({}, 'What file gets created?'),
            HTML.input({ className: 'filename', onChange: this.set('result') }),
            HTML.h4({}, 'If there is an ID column, what is it called? '),
            HTML.input({ className: 'key', onChange: this.set('key') }),
            HTML.p({}, 'An ID column it can be used to discover changes, otherwise only additions and deletions can be determined.'),
            HTML.hr({}),
            HTML.h4({}, 'What should happen next?'),
            React.createElement(TriggerEntry, { onChange: this.set('triggers') }),
            HTML.hr({}),
            HTML.button({ onClick: this.create }, 'Create agent')
        ]
        return HTML.div({ className: 'new-agent-page', ref: node => this.node = node }, ...[
            title,
            hr,
            HTML.div({}, ...elements)
        ])
    }

}
