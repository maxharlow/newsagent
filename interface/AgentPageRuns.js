import React from 'react'
import Moment from 'moment'
import RunDataView from '/RunDataView.js'
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
            this.props.setRunDisabled(response.find(run => run.state === 'queued' && run.initiator === 'manual'))
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
            const message = React.DOM.span({ className: 'not-yet' }, 'This agent has not run yet.')
            return React.DOM.div({ className: 'agent-page-runs' }, React.DOM.h3({}, 'Runs'), message)
        }
        else {
            const keys = Object.keys(this.state.runs)
            const keysLimited = keys.slice(0, keys.length - this.state.hidden)
            const items = keysLimited.map(i => {
                const run = this.state.runs[i]
                if (run.state === 'queued') {
                    const info = [
                        React.DOM.span({ className: 'initiator' }, run.initiator)
                    ]
                    const fields = [
                        React.DOM.span({ className: 'state ' + run.state }, run.state),
                        React.DOM.div({ className: 'info' }, ...info)
                    ]
                    return React.DOM.li({ className: run.state }, ...fields)
                }
                else if (run.state === 'running') {
                    const info = [
                        React.DOM.span({ className: 'initiator' }, run.initiator),
                        React.DOM.span({ className: 'date', title: Moment(run.dateStarted).format('LLL') }, 'started ' + Moment(run.dateStarted).fromNow())
                    ]
                    const fields = [
                        React.DOM.span({ className: 'state ' + run.state }, run.state),
                        React.DOM.div({ className: 'info' }, ...info)
                    ]
                    return React.DOM.li({ className: run.state }, ...fields)
                }
                else if (run.state === 'failure') {
                    const execution = run.execution.map(line => {
                        const state = line.code === 0 ? 'success' : 'failure'
                        const command = React.DOM.span({ className: 'stdin' }, line.command + '\n')
                        const outputs = line.log.map(entry => React.DOM.span({ className: entry.type }, entry.value))
                        return React.DOM.div({ className: state }, command, ...outputs)
                    })
                    const info = [
                        React.DOM.span({ className: 'initiator' }, run.initiator),
                        React.DOM.span({ className: 'date', title: Moment(run.dateStarted).format('LLL') }, 'ran ' + Moment(run.dateStarted).fromNow()),
                        React.DOM.span({ className: 'duration', title: run.duration + 'ms' }, 'took ' + Moment.duration(run.duration).humanize())
                    ]
                    const fields = [
                        React.DOM.span({ className: 'state ' + run.state }, run.state),
                        React.DOM.div({ className: 'info' }, ...info),
                        React.DOM.code({ className: 'execution' }, execution)
                    ]
                    return React.DOM.li({ className: run.state }, ...fields)
                }
                else {
                    const records = run.recordsAdded === 0 && run.recordsRemoved === 0
                          ? 'nothing changed'
                          : 'added ' + run.recordsAdded.toLocaleString() + ', removed ' + run.recordsRemoved.toLocaleString()
                    const execution = run.execution.map(line => {
                        const command = React.DOM.span({ className: 'stdin' }, line.command + '\n')
                        const outputs = line.log.map(entry => React.DOM.span({ className: entry.type }, entry.value))
                        return React.DOM.div({}, command, ...outputs)
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
                        React.DOM.span({ className: 'initiator' }, run.initiator),
                        React.DOM.span({ className: 'date', title: Moment(run.dateStarted).format('LLL') }, 'ran ' + Moment(run.dateStarted).fromNow()),
                        React.DOM.span({ className: 'duration', title: run.duration + 'ms' }, 'took ' + Moment.duration(run.duration).humanize()),
                        React.DOM.span({ className: 'records' }, records)
                    ]
                    const fields = [
                        React.DOM.span({ className: 'state ' + run.state }, run.state),
                        React.DOM.div({ className: 'info' }, ...info),
                        React.DOM.button({ onClick: () => this.setState({ viewing: run }), className: 'hollow' }, 'View'),
                        React.DOM.button({ onClick: this.download(run.id), className: 'hollow' }, 'Download'),
                        React.DOM.code({ className: 'execution' }, execution),
                        React.DOM.ol({ className: 'triggered' }, triggered)
                    ]
                    return React.DOM.li({ className: run.state }, ...fields)
                }
            })
            const list = React.DOM.ol({}, ...items)
            const unhide = this.state.hidden === 0
                  ? ''
                  : React.DOM.button({ onClick: this.unhide, className: 'hollow unhide' }, `Show ${this.state.hidden.toLocaleString()} more...`)
            const view = !this.state.viewing ? '' : React.createElement(RunDataView, {
                id: this.props.id,
                run: this.state.viewing.id,
                date: this.state.viewing.date,
                close: () => this.setState({ viewing: null })
            })
            return React.DOM.div({ className: 'agent-page-runs' }, React.DOM.h3({}, 'Runs'), list, unhide, view)
        }
    }

}
