import React from 'react'
import PrettyCron from 'prettycron'

export default class CronEntry extends React.Component {

    constructor() {
        super()
        this.presets = [
            { name: 'Hourly', value: '0 * * * *' },
            { name: 'Daily',  value: '0 1 * * *' },
            { name: 'Weekly', value: '0 1 * * 1' }
        ]
        this.state = this.presets.find(preset => preset.name === 'Daily')
        this.update = this.update.bind(this)
        this.updateCustom = this.updateCustom.bind(this)
    }

    update(event) {
        const value = this.presets.find(preset => preset.name === event.target.name).value
        this.setState({ name: event.target.name, value })
        this.props.onChange({ target: { value } })
    }

    updateCustom(event) {
        this.setState({ name: 'Custom', value: event.target.value })
        this.props.onChange({ target: { value: event.target.value } })
    }

    render() {
        const presets = this.presets.map(preset => {
            const input = React.DOM.input({ type: 'radio', name: preset.name, value: preset.value, checked: preset.name === this.state.name, onChange: this.update })
            const text = React.DOM.span({}, preset.name)
            return React.DOM.label({}, input, text)
        })
        const customRadio = React.DOM.input({ type: 'radio', value: this.state.value, checked: this.state.name === 'Custom', onChange: this.updateCustom })
        const customInput = React.DOM.input({ ref: 'custom', value: this.state.value, disabled: this.state.name !== 'Custom', onChange: this.updateCustom })
        const customText = React.DOM.span({}, 'Custom...', customInput)
        const custom = React.DOM.label({}, customRadio, customText)
        const description = React.DOM.p({}, 'Runs at ' + PrettyCron.toString(this.state.value).toLowerCase() + '.')
        return React.DOM.div({ className: 'cron' }, ...presets, custom, description)
    }

    componentDidUpdate() {
        if (this.state.name = 'Custom') this.refs.custom.focus()
    }

}
