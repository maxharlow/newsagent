import React from 'react'
import Moment from 'moment'
import HTTP from '/HTTP.js'
import Config from '/config.js'

export default class AgentPageRuns extends React.Component {

    constructor() {
        super()
        this.load = this.load.bind(this)
        this.download = this.download.bind(this)
        this.unhide = this.unhide.bind(this)
    }

    componentWillMount() {
        this.load()
    }

    componentWillUnmount() {
        if (this.state && this.state.timeout) clearTimeout(this.state.timeout)
    }

    load() {
        HTTP.get(Config.registry + '/agents/' + this.props.id + '/runs').then(response => {
            const hidden = (this.state !== null && this.state.hidden === 0) || response.length <= 12 ? 0 : response.length - 10
            const timeout = setTimeout(this.load, 1 * 1000) // in seconds
            this.setState({ runs: response, hidden, timeout })
        })
    }

    download(run) {
        return () => {
            HTTP.get(Config.registry + '/agents/' + this.props.id + '/runs/' + run, [{ 'Accept': 'text/csv' }]).then(response => {
                const blob = new Blob([response], { type: 'data:text/csv;charset=utf-8,' })
                const anchor = document.createElement('a')
                anchor.setAttribute('href', URL.createObjectURL(blob))
                anchor.setAttribute('download', `datastash-${this.props.id}-${run}.csv`)
                document.body.appendChild(anchor)
                anchor.click()
            })
        }
    }

    unhide() {
        this.setState({ hidden: 0 })
    }

    render() {
        if (this.state === null) {
            const loading = React.DOM.div({ className: 'loading' })
            return React.DOM.div({ className: 'agent-page-runs' }, React.DOM.h3({}, 'Runs'), loading)
        }
        else if (this.state.runs === undefined || this.state.runs.length === 0) {
            return React.DOM.div({ className: 'agent-page-runs' }, React.DOM.h3({}, 'Runs'), 'This agent has not run yet.')
        }
        else {
            const keys = Object.keys(this.state.runs)
            const keysLimited = keys.slice(0, keys.length - this.state.hidden)
            const items = keysLimited.map(i => {
                const run = this.state.runs[i]
                if (run.state === 'system-error') {
                    const info = [
                        React.DOM.span({ className: 'date', title: Moment(run.date).format('LLL') }, 'ran ' + Moment(run.date).fromNow()),
                        React.DOM.span({ className: 'duration', title: run.duration + 'ms' }, 'took ' + Moment.duration(run.duration).humanize())
                    ]
                    const fields = [
                        React.DOM.span({ className: 'state ' + run.state }, run.state),
                        React.DOM.div({ className: 'info' }, ...info),
                        React.DOM.code({ className: 'messages' }, run.message)
                    ]
                    return React.DOM.li({ className: run.state }, ...fields)
                }
                else if (run.state === 'failure') {
                    const messages = run.messages.map(message => {
                        return React.DOM.span({ className: message.type }, message.value)
                    })
                    const info = [
                        React.DOM.span({ className: 'date', title: Moment(run.date).format('LLL') }, 'ran ' + Moment(run.date).fromNow()),
                        React.DOM.span({ className: 'duration', title: run.duration + 'ms' }, 'took ' + Moment.duration(run.duration).humanize())
                    ]
                    const fields = [
                        React.DOM.span({ className: 'state ' + run.state }, run.state),
                        React.DOM.div({ className: 'info' }, ...info),
                        React.DOM.code({ className: 'messages' }, messages)
                    ]
                    return React.DOM.li({ className: run.state }, ...fields)
                }
                else {
                    const records = run.recordsAdded === 0 && run.recordsRemoved === 0
                          ? 'nothing changed'
                          : 'added ' + run.recordsAdded + ', removed ' + run.recordsRemoved
                    const messages = run.messages.map(message => {
                        return React.DOM.span({ className: message.type }, message.value)
                    })
                    const triggered = run.triggered.map(trigger => {
                        const status = [
                            React.DOM.span({ className: 'type' }, trigger.type),
                            React.DOM.span({ className: 'recipient' }, trigger.recipient),
                            React.DOM.span({ className: 'status' }, trigger.status)
                        ]
                        return React.DOM.li({}, status)
                    })
                    const info = [
                        React.DOM.span({ className: 'date', title: Moment(run.date).format('LLL') }, 'ran ' + Moment(run.date).fromNow()),
                        React.DOM.span({ className: 'duration', title: run.duration + 'ms' }, 'took ' + Moment.duration(run.duration).humanize()),
                        React.DOM.span({ className: 'records' }, records)
                    ]
                    const fields = [
                        React.DOM.span({ className: 'state ' + run.state }, run.state),
                        React.DOM.div({ className: 'info' }, ...info),
                        React.DOM.button({ onClick: this.download(run.id), className: 'hollow' }, 'Download'),
                        React.DOM.code({ className: 'messages' }, messages),
                        React.DOM.ol({ className: 'triggered' }, triggered)
                    ]
                    return React.DOM.li({ className: run.state }, ...fields)
                }
            })
            const list = React.DOM.ol({}, ...items)
            const unhide = this.state.hidden > 0 ? '' : React.DOM.button({ onClick: this.unhide, className: 'hollow unhide' }, `Show ${this.state.hidden} more`)
            return React.DOM.div({ className: 'agent-page-runs' }, React.DOM.h3({}, 'Runs'), list, unhide)
        }
    }

}
