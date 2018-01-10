import React from 'react'
import HTML from 'react-dom-factories'

export default class CommandEntry extends React.Component {

    constructor(props) {
        super(props)
        if (props.value) this.state = { commands: props.value }
        else this.state = { commands: [] }
        this.press = this.press.bind(this)
        this.leave = this.leave.bind(this)
    }

    press(number) {
        return event => {
            if (event.key === 'ArrowUp' && number > 0) { // up arrow and not at top
                const focus = { number: number - 1, selectionStart: this.commands[number - 1].value.length, selectionEnd: this.commands[number - 1].value.length  }
                this.setState({ focus })
            }
            else if (event.key === 'ArrowDown' && number < this.state.commands.length - 1) { // down arrow and not at bottom
                const focus = { number: number + 1, selectionStart: this.commands[number + 1].value.length, selectionEnd: this.commands[number + 1].value.length  }
                this.setState({ focus })
            }
            else if (event.key === 'Enter'
                     && this.state.commands[number]
                     && this.state.commands[number] !== ''
                     && (number === this.state.commands.length - 1 || this.state.commands[number + 1] !== '')) { // enter and command not blank
                const focus = { number: number + 1, selectionStart: 0, selectionEnd: 0 }
                var commands = Array.from(this.state.commands)
                const textBefore = this.commands[number].value.slice(0, this.commands[number].selectionEnd)
                const textAfter = this.commands[number].value.slice(this.commands[number].selectionEnd)
                commands[number] = textBefore
                commands.splice(number + 1, 0, textAfter)
                this.setState({ focus, commands })
            }
            else {
                const focus = { number, selectionStart: this.commands[number].selectionStart, selectionEnd: this.commands[number].selectionEnd }
                const commands = Object.assign(this.state.commands, { [number]: this.commands[number].value })
                this.setState({ focus, commands })
            }
            this.props.onChange({ target: { value: this.state.commands.filter(command => command !== '') } })
        }
    }

    leave(event) {
        const external = Object.keys(this.commands).find(key => this.commands[key] === event.relatedTarget) === undefined
        if (external) this.setState({ commands: this.state.commands.filter(command => command !== ''), focus: undefined })
    }

    shouldComponentUpdate(_, nextState) {
        return this.state !== nextState
    }

    componentDidUpdate() {
        if (this.state.focus !== undefined) {
            const element = this.commands[this.state.focus.number]
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

    render() {
        const lines = this.state.commands.length === 0 ? this.state.commands.concat(['']) : this.state.commands
        this.commands = {}
        const commands = lines.map((line, i) => {
            const add = input => this.commands[i] = input
            return HTML.input({ key: line, ref: add, defaultValue: line, onKeyUp: this.press(i), onBlur: this.leave })
        })
        return HTML.code({ className: 'command-entry' }, HTML.ol({}, ...commands.map(command => HTML.li({ className: 'stdin' }, command))))
    }

}
