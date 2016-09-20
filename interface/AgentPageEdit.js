import React from 'react'
import Dialog from '/Dialog.js'
import CronEntry from '/CronEntry.js'
import CommandEntry from '/CommandEntry.js'
import TriggerEntry from '/TriggerEntry.js'
import HTTP from '/HTTP.js'
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
            this.setState({ recipe: Object.assign(this.state.recipe, { [field]: value }) })
        }
    }

    validate() {
        const validation = {
            run: this.state.recipe.run.length === 0 || this.state.recipe.run[0] === '',
            result: this.state.recipe.result === ''
        }
        this.setState({ validation })
        const isValid = Object.keys(validation).every(key => validation[key] === false)
        return isValid
    }

    send() {
        HTTP.patch(Config.registry + '/agents/' + this.props.id, [], this.state.recipe).then(() => this.setState({ confirming: false }))
    }

    render() {
        const body = [
            React.DOM.h5({}, 'Edit agent'),
            React.DOM.h4({}, 'Name'),
            React.DOM.input({ value: this.state.recipe.name, onChange: this.set('name') }),
            React.DOM.h4({}, 'Description'),
            React.DOM.input({ value: this.state.recipe.description, onChange: this.set('description') }),
            React.DOM.h4({}, 'Run schedule'),
            React.createElement(CronEntry, { value: this.state.recipe.schedule, onChange: this.set('schedule') }),
            this.state.validation['run'] ? React.DOM.span({ className: 'validation' }, 'At least one command needs to be entered') : null,
            React.DOM.h4({}, 'Run commands'),
            React.createElement(CommandEntry, { value: this.state.recipe.run, onChange: this.set('run') }),
            React.DOM.p({}, ''),
            this.state.validation['result'] ? React.DOM.span({ className: 'validation' }, 'You must give the name of the file that gets created by this agent') : null,
            React.DOM.h4({}, 'Result file'),
            React.DOM.input({ value: this.state.recipe.result, onChange: this.set('result') }),
            React.DOM.h4({}, 'Triggers'),
            React.createElement(TriggerEntry, { value: this.state.recipe.triggers, onChange: this.set('triggers') })
        ]
        const dialog = !this.state.confirming ? undefined : React.createElement(Dialog, {
            body,
            acceptText: 'Save changes',
            accept: this.send,
            validate: this.validate,
            cancel: () => this.setState({ confirming: false })
        })
        const editButton = React.DOM.button({ onClick: () => this.setState({ confirming: true }) }, 'Edit')
        return React.DOM.div({ className: 'agent-page-edit' }, editButton, dialog)
    }

}
