import React from 'react'

export default class TriggerEntry extends React.Component {

    constructor() {
        super()
        this.state = { current: '', triggers: [] }
        this.update = this.update.bind(this)
        this.add = this.add.bind(this)
        this.remove = this.remove.bind(this)
    }

    update(event) {
        if (event.key === 'Enter') return this.add()
        this.setState({ current: event.target.value })
    }

    add() {
        if (this.state.current === '') return
        const trigger = { recipient: this.state.current }
        const triggers = this.state.triggers.concat(trigger)
        this.setState({ current: '', triggers })
        this.props.onChange({ target: { value: triggers } })
    }

    remove(number) {
        return event => {
            const triggers = this.state.triggers.filter((_, i) => i !== number)
            this.setState({ triggers })
            this.props.onChange({ target: { value: triggers } })
        }
    }

    render() {
        const currentElements = this.state.triggers.map((trigger, i) => {
            const parts = [
                React.DOM.span({ className: 'event' }, 'If the data changes'),
                React.DOM.span({ className: 'action' }, 'email'),
                React.DOM.span({ className: 'recipient' }, trigger.recipient),
                React.DOM.button({ onClick: this.remove(i) }, '×')
            ]
            return React.DOM.li({}, ...parts)
        })
        const current = React.DOM.ol({}, ...currentElements)
        const adderElements = [
            React.DOM.span({ className: 'event' }, 'If the data changes'),
            React.DOM.span({ className: 'action' }, 'email'),
            React.DOM.input({ className: 'recipient', value: this.state.current, onChange: this.update, onKeyUp: this.update }),
            React.DOM.button({ onClick: this.add }, '+')
        ]
        const adder = React.DOM.div({ className: 'adder' }, ...adderElements)
        return React.DOM.div({ className: 'trigger-entry' }, current, adder)
    }

}
