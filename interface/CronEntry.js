import React from 'react'
import PrettyCron from 'prettycron'

export default class CronEntry extends React.Component {

    constructor(props) {
        super(props)
        this.presets = [
            { name: 'Never',  value: '' },
            { name: 'Hourly', value: '0 * * * *' },
            { name: 'Daily',  value: '0 1 * * *' },
            { name: 'Weekly', value: '0 1 * * 1' }
        ]
        if (this.props.value) this.state = this.presets.find(preset => preset.value === this.props.value) || { name: 'Custom', value: this.props.value }
        else this.state = this.presets.find(preset => preset.name === 'Daily')
        this.update = this.update.bind(this)
    }

    update(event) {
        const value = event.target.name === 'Custom'
              ? event.target.value
              : this.presets.find(preset => preset.name === event.target.name).value
        this.setState({ name: event.target.name, value })
        this.props.onChange({ target: { value } })
    }

    render() {
        const presets = this.presets.map(preset => {
            const input = React.DOM.input({ type: 'radio', name: preset.name, value: preset.value, checked: preset.name === this.state.name, onChange: this.update })
            const text = React.DOM.span({}, preset.name)
            return React.DOM.label({}, input, text)
        })
        const customRadio = React.DOM.input({ type: 'radio', name: 'Custom', value: this.state.value, checked: this.state.name === 'Custom', onChange: this.update })
        const customInput = React.DOM.input({ ref: input => this.custom = input, name: 'Custom', value: this.state.value, disabled: this.state.name !== 'Custom', onChange: this.update })
        const customText = React.DOM.span({}, 'Custom...', customInput)
        const custom = React.DOM.label({}, customRadio, customText)
        const description = React.DOM.p({}, this.state.value === '' ? 'Never runs.' : 'Run at ' + PrettyCron.toString(this.state.value).toLowerCase() + '.')
        return React.DOM.div({ className: 'cron-entry' }, ...presets, custom, description)
    }

    componentDidUpdate(_, prevState) {
        if (this.state.name === 'Custom' && this.state !== prevState) this.custom.focus()
    }

}
