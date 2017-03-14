import React from 'react'
import Moment from 'moment'
import MomentDurationFormat from 'moment-duration-format'
import HTTP from '/HTTP.js'
import Config from '/Config.js'

export default class RunPageExecution extends React.Component {

    constructor() {
        super()
        this.load = this.load.bind(this)
    }

    shouldComponentUpdate(_, nextState) {
        return nextState !== null || JSON.stringify(this.state) !== JSON.stringify(nextState)
    }

    componentWillMount() {
        this.load()
    }

    load() {
        const retry = () => {
            if (!this.node) return
            const timeout = setTimeout(this.load, 1 * 1000)
            this.setState({ timeout })
        }
        const update = response => {
            if (!this.node) return
            const isRunning = response[response.length - 1].code === undefined
            const isScrollable = document.body.scrollHeight > window.innerHeight
            const atTop = document.body.scrollTop === 0
            const atBottom = document.body.offsetHeight - (window.innerHeight + document.body.scrollTop) < 2
            const shouldScroll = isRunning && ((!isScrollable && atTop) || (isScrollable && atBottom))
            if (this.props.state === 'success' || this.props.state === 'failure') this.setState({ execution: response })
            else {
                const timeout = setTimeout(this.load, 1 * 1000) // in milliseconds
                this.setState({ timeout, execution: response })
            }
            if (shouldScroll) document.body.scrollTop = document.body.scrollHeight - window.innerHeight
        }
        HTTP.get(Config.registry + '/agents/' + this.props.agent + '/runs/' + this.props.run + '/execution').then(update).catch(retry)
    }

    render() {
        if (this.props.state === 'queued') {
            const waiting = React.DOM.span({ className: 'not-yet' }, 'Waiting to run...')
            return React.DOM.div({ className: 'run-page-execution', ref: node => this.node = node }, waiting)
        }
        else if (this.state === null || this.state.execution === undefined) {
            const loading = React.DOM.div({ className: 'loading' })
            return React.DOM.div({ className: 'run-page-execution', ref: node => this.node = node }, loading)
        }
        else {
            const execution = this.state.execution.map(line => {
                const command = React.DOM.li({ className: 'stdin' }, line.command + '\n')
                if (line.state === 'running' && this.props.state !== 'running') { // run failed on this line
                    return React.DOM.div({ className: 'execution' }, React.DOM.code({}, command))
                }
                else { // line has run or is running
                    const maxLogLength = 500
                    const outputs = line.log.slice(0, maxLogLength).map(entry => React.DOM.li({ className: entry.type }, entry.value))
                    const unseen = line.log.length > maxLogLength
                          ? React.DOM.span({ className: 'unseen' }, 'Output too large to display: ' + (line.log.length - maxLogLength).toLocaleString() + ' rows hidden.')
                          : null
                    const exit = line.code > 0 ? React.DOM.span({ className: 'exit' }, 'Exited with code ' + line.code + '.') : null
                    const durationNow = line.duration || new Date() - new Date(line.dateStarted)
                    const durationText = Moment.duration(durationNow, 'ms').format('h[h] m[m] s[s]')
                    const duration = React.DOM.span({ className: 'duration' }, durationText)
                    const state = line.code === undefined ? 'running'
                          : line.code === 0 ? 'success'
                          : 'failure'
                    const code = React.DOM.code({}, React.DOM.ol({}, command, ...outputs))
                    return React.DOM.div({ className: 'execution ' + state }, code, duration, unseen, exit)
                }
            })
            const finishing = this.props.state === 'running' && this.state.execution[this.state.execution.length - 1].code !== undefined
                  ? React.DOM.div({ className: 'finishing' }, 'Finishing up...')
                  : null
            return React.DOM.div({ className: 'run-page-execution', ref: node => this.node = node }, ...execution, finishing)
        }
    }

}
