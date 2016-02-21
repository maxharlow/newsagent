import React from 'react'
import PrettyCron from 'prettycron'

export default class CronEntry extends React.Component {

    constructor() {
        super()
        this.update = this.update.bind(this)
        this.state = { value: '0 1 * * *' }
    }

    update(event) {
        this.setState({ value: event.target.value })
        this.props.onChange(event)
    }

    render() {
        const elements = [
            React.DOM.input({ value: this.state.value, onChange: this.update }),
            React.DOM.span({ className: 'note' }, 'Runs at ' + PrettyCron.toString(this.state.value).toLowerCase() + '.')
        ]
        return React.DOM.div({}, ...elements)
    }

}
