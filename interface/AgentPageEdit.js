import React from 'react'
import HTML from 'react-dom-factories'
import Dialog from '/Dialog.js'
import CronEntry from '/CronEntry.js'
import CommandEntry from '/CommandEntry.js'
import TriggerEntry from '/TriggerEntry.js'
import Config from '/Config.js'

export default class AgentPageEdit extends React.Component {

    constructor(props) {
        super(props)
        this.state = { confirming: false, validation: {}, recipe: props.recipe }
        this.set = this.set.bind(this)
        this.validate = this.validate.bind(this)
        this.send = this.send.bind(this)
    }

    set(field) {
        return event => {
            const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
            this.setState({ recipe: Object.assign({}, this.state.recipe, { [field]: value }) })
        }
    }

    validate() {
        const validation = {
            name: this.state.recipe.name === '',
            run: this.state.recipe.run.length === 0 || this.state.recipe.run[0] === '',
            result: this.state.recipe.result === ''
        }
        this.setState({ validation })
        const isValid = Object.keys(validation).every(key => validation[key] === false)
        return isValid
    }

    send() {
        const abort = error => {
            console.error('Could not update agent', error)
        }
        const update = () => {
            if (!this.node) return
            this.setState({ confirming: false })
        }
        const recipe = this.state.recipe.key !== '' // turn empty string into null
              ? this.state.recipe
              : Object.assign(this.state.recipe, { key: null })
        fetch(Config.registry + '/agents/' + this.props.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipe)
        })
            .then(update)
            .catch(abort)
    }

    render() {
        const body = [
            HTML.h5({}, 'Edit agent'),
            this.state.validation['name'] ? HTML.span({ className: 'validation' }, 'You must give this agent a name') : null,
            HTML.h4({}, 'Name'),
            HTML.input({ value: this.state.recipe.name, onChange: this.set('name') }),
            HTML.h4({}, 'Description'),
            HTML.input({ value: this.state.recipe.description, onChange: this.set('description') }),
            HTML.h4({}, 'Run schedule'),
            React.createElement(CronEntry, { value: this.state.recipe.schedule, onChange: this.set('schedule') }),
            this.state.validation['run'] ? HTML.span({ className: 'validation' }, 'At least one command needs to be entered') : null,
            HTML.h4({}, 'Run commands'),
            React.createElement(CommandEntry, { value: this.state.recipe.run, onChange: this.set('run') }),
            this.state.validation['result'] ? HTML.span({ className: 'validation' }, 'You must give the name of the file that gets created by this agent') : null,
            HTML.h4({}, 'Result file'),
            HTML.input({ className: 'filename', value: this.state.recipe.result, onChange: this.set('result') }),
            HTML.h4({}, 'ID field'),
            HTML.input({ value: this.state.recipe.key || '', onChange: this.set('key') }),
            HTML.h4({}, 'Triggers'),
            React.createElement(TriggerEntry, { value: this.state.recipe.triggers, onChange: this.set('triggers') })
        ]
        const dialog = !this.state.confirming ? null : React.createElement(Dialog, {
            body,
            acceptText: 'Save changes',
            accept: this.send,
            validate: this.validate,
            cancel: () => this.setState({ confirming: false })
        })
        const editButton = HTML.button({ onClick: () => this.setState({ confirming: true }) }, 'Edit')
        return HTML.div({ className: 'agent-page-edit', ref: node => this.node = node }, editButton, dialog)
    }

}
