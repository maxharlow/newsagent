import React from 'react'

export default class CommandEntry extends React.Component {

    constructor() {
        super()
        this.state = { commands: [] }
        this.press = this.press.bind(this)
        this.leave = this.leave.bind(this)
    }

    press(number) {
        return event => {
            if (event.key === 'ArrowUp' && number > 0) { // up arrow and not at top
                const focus = { number: number - 1, selectionStart: this.refs[number - 1].value.length, selectionEnd: this.refs[number - 1].value.length  }
                this.setState({ focus })
            }
            else if (event.key === 'ArrowDown' && number < this.state.commands.length - 1) { // down arrow and not at bottom
                const focus = { number: number + 1, selectionStart: this.refs[number + 1].value.length, selectionEnd: this.refs[number + 1].value.length  }
                this.setState({ focus })
            }
            else if (event.key === 'Enter'
                     && this.state.commands[number]
                     && this.state.commands[number] !== ''
                     && (number === this.state.commands.length - 1 || this.state.commands[number + 1] !== '')) { // enter and command not blank
                const focus = { number: number + 1, selectionStart: 0, selectionEnd: 0 }
                var commands = Array.from(this.state.commands)
                const textBefore = this.refs[number].value.slice(0, this.refs[number].selectionEnd)
                const textAfter = this.refs[number].value.slice(this.refs[number].selectionEnd)
                commands[number] = textBefore
                commands.splice(number + 1, 0, textAfter)
                this.setState({ focus, commands })
            }
            else {
                const focus = { number, selectionStart: this.refs[number].selectionStart, selectionEnd: this.refs[number].selectionEnd }
                const commands = Object.assign(this.state.commands, { [number]: this.refs[number].value })
                this.setState({ focus, commands })
            }
            this.props.onChange({ target: { value: this.state.commands.filter(command => command !== '') } })
        }
    }

    leave(event) {
        const external = Object.keys(this.refs).find(key => this.refs[key] === event.relatedTarget) === undefined
        if (external) this.setState({ commands: this.state.commands.filter(command => command !== ''), focus: undefined })
    }

    render() {
        const lines = this.state.commands.length === 0 ? this.state.commands.concat(['']) : this.state.commands
        const commands = lines.map((line, i) => React.DOM.input({ key: line, ref: i, defaultValue: line, onKeyUp: this.press(i), onBlur: this.leave }))
        return React.DOM.code({ className: 'command-entry' }, React.DOM.ol({}, commands.map((command, i) => React.DOM.li({ key: i }, command))))
    }

    componentDidUpdate() {
        if (this.state.focus !== undefined) {
            const element = this.refs[this.state.focus.number]
            if (element.setSelectionRange) {
                element.focus()
                element.setSelectionRange(this.state.focus.selectionStart, this.state.focus.selectionEnd)
            }
            else if (element.createTextRange) {
                const range = element.createTextRange()
                range.collapse(true)
                range.moveEnd('character', this.state.focus.selectionStart)
                range.moveStart('character', this.state.focus.selectionEnd)
                range.select()
            }

        }
    }

}
