import React from 'react'

export default class AlertEntry extends React.Component {

    constructor() {
        super()
        this.state = { current: '', alerts: [] }
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
        const alert = { recipient: this.state.current }
        const alerts = this.state.alerts.concat(alert)
        this.setState({ current: '', alerts })
        this.props.onChange({ target: { value: alerts } })
    }

    remove(number) {
        return event => {
            const alerts = this.state.alerts.filter((_, i) => i !== number)
            this.setState({ alerts })
            this.props.onChange({ target: { value: alerts } })
        }
    }

    render() {
        const currentElements = this.state.alerts.map((alert, i) => {
            const parts = [
                React.DOM.span({ className: 'event' }, 'If the data changes'),
                React.DOM.span({ className: 'action' }, 'email'),
                React.DOM.span({ className: 'recipient' }, alert.recipient),
                React.DOM.button({ onClick: this.remove(i) }, '×')
            ]
            return React.DOM.li({}, ...parts)
        })
        const current = React.DOM.ol({}, ...currentElements)
        const adderElements = [
            React.DOM.span({ className: 'event' }, 'If the data changes'),
            React.DOM.span({className: 'action' }, 'email'),
            React.DOM.input({ className: 'recipient', value: this.state.current, onChange: this.update, onKeyUp: this.update }),
            React.DOM.button({ onClick: this.add }, '+')
        ]
        const adder = React.DOM.div({ className: 'adder' }, ...adderElements)
        return React.DOM.div({ className: 'alerts' }, current, adder)
    }

}
