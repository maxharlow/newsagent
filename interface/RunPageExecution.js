import React from 'react'
import Moment from 'moment'
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

    componentWillUnmount() {
        if (this.state && this.state.timeout) clearTimeout(this.state.timeout)
    }

    load() {
        const retry = () => {
            const timeout = setTimeout(this.load, 1 * 1000)
            this.setState({ timeout })
        }
        const update = response => {
            // should scroll if (page not scrolling and at top) or (page scrolling and at bottom)
            const shouldScroll = (document.body.scrollHeight === window.innerHeight && document.body.scrollTop === 0)
                  || (document.body.scrollHeight > window.innerHeight && document.body.offsetHeight - (window.innerHeight + document.body.scrollTop) < 2)
            if (this.props.state === 'success' || this.props.state === 'failure') this.setState({ execution: response })
            else {
                const timeout = setTimeout(this.load, 1 * 1000) // in seconds
                this.setState({ timeout, execution: response })
            }
            if (shouldScroll) document.body.scrollTop = document.body.scrollHeight - window.innerHeight
        }
        HTTP.get(Config.registry + '/agents/' + this.props.agent + '/runs/' + this.props.run + '/execution').then(update).catch(retry)
    }

    render() {
        if (this.props.state === 'queued') {
            return React.DOM.div({ className: 'run-page-execution' }, React.DOM.span({ className: 'not-yet' }, 'Waiting to run...'))
        }
        else if (this.state === null) {
            const loading = React.DOM.div({ className: 'loading' })
            return React.DOM.div({ className: 'run-page-execution' }, loading)
        }
        else {
            const execution = this.state.execution.map(line => {
                if (line.code !== undefined) {
                    const state = line.code === 0 ? 'success' : 'failure'
                    const exit = line.code > 0 ? React.DOM.span({ className: 'exit' }, 'Code ' + line.code) : ''
                    const command = React.DOM.span({ className: 'stdin' }, line.command + '\n')
                    const outputs = line.log.length > 5000
                          ? '(this output is too large to display)'
                          : line.log.map(entry => React.DOM.span({ className: entry.type }, entry.value))
                    const duration = React.DOM.span({ className: 'duration' }, Math.round(Moment.duration(line.duration).asSeconds()) + 's')
                    return React.DOM.div({ className: 'execution ' + state }, React.DOM.code({}, exit, command, ...outputs), duration)
                }
                else { // line still running
                    const command = React.DOM.span({ className: 'stdin' }, line.command + '\n')
                    const durationNow = new Date() - new Date(line.dateStarted)
                    const duration = React.DOM.span({ className: 'duration' }, Math.round(Moment.duration(durationNow).asSeconds()) + 's')
                    return React.DOM.div({ className: 'execution running' }, React.DOM.code({}, command), duration)
                }
            })
            const finishing = this.props.state === 'running'
                  && this.state.execution[this.state.execution.length - 1].code !== undefined
                  ? React.DOM.div({ className: 'finishing' }, 'Finishing up...') : ''
            return React.DOM.div({ className: 'run-page-execution', ref: 'execution' }, ...execution, finishing)
        }
    }

}
