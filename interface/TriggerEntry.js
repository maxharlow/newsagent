import React from 'react'
import HTML from 'react-dom-factories'

export default class TriggerEntry extends React.Component {

    constructor(props) {
        super(props)
        if (this.props.value) this.state = { current: '', triggers: this.props.value }
        else this.state = { current: '', triggers: [] }
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
                HTML.span({ className: 'event' }, 'If the data changes'),
                HTML.span({ className: 'action' }, 'email'),
                HTML.span({ className: 'recipient' }, trigger.recipient),
                HTML.button({ onClick: this.remove(i) }, '×')
            ]
            return HTML.li({}, ...parts)
        })
        const current = HTML.ol({}, ...currentElements)
        const adderElements = [
            HTML.span({ className: 'event' }, 'If the data changes'),
            HTML.span({ className: 'action' }, 'email'),
            HTML.input({ className: 'recipient', value: this.state.current, onChange: this.update, onKeyUp: this.update }),
            HTML.button({ onClick: this.add }, '+')
        ]
        const adder = HTML.div({ className: 'adder' }, ...adderElements)
        return HTML.div({ className: 'trigger-entry' }, current, adder)
    }

}
