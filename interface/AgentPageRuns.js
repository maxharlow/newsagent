import React from 'react'
import Moment from 'moment'
import RunDataView from '/RunDataView.js'
import HTTP from '/HTTP.js'
import Config from '/Config.js'

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

    load() {
        const abort = error => {
            console.error('Could not load runs', error)
        }
        const update = response => {
            if (!this.node) return
            const hidden = (this.state !== null && this.state.hidden === 0) || response.length <= 12 ? 0 : response.length - 10
            const timeout = setTimeout(this.load, 1 * 1000) // in milliseconds
            this.setState({ runs: response, hidden, timeout })
            this.props.setRunDisabled(response.find(run => run.state === 'queued' && run.initiator === 'manual'))
        }
        HTTP.get(Config.registry + '/agents/' + this.props.id + '/runs').then(update).catch(abort)
    }

    download(run) {
        return error => {
            const abort = error => {
                console.error('Could not download data', error)
            }
            const send = response => {
                const blob = new Blob([response], { type: 'data:text/csv;charset=utf-8,' })
                const anchor = document.createElement('a')
                anchor.setAttribute('href', URL.createObjectURL(blob))
                anchor.setAttribute('download', `${this.props.id}-${run}.csv`)
                document.body.appendChild(anchor)
                anchor.click()
            }
            HTTP.get(Config.registry + '/agents/' + this.props.id + '/runs/' + run + '/data', [{ 'Accept': 'text/csv' }]).then(send).catch(abort)
        }
    }

    unhide() {
        this.setState({ hidden: 0 })
    }

    render() {
        if (this.state === null) {
            const loading = React.DOM.div({ className: 'loading' })
            return React.DOM.div({ className: 'agent-page-runs', ref: node => this.node = node }, React.DOM.h3({}, 'Runs'), loading)
        }
        else if (this.state.runs === undefined || this.state.runs.length === 0) {
            const message = React.DOM.span({ className: 'not-yet' }, 'This agent has not run yet.')
            return React.DOM.div({ className: 'agent-page-runs', ref: node => this.node = node }, React.DOM.h3({}, 'Runs'), message)
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
                        React.DOM.span({ className: 'state ' + run.state }, React.DOM.a({ href: `/agents/${this.props.id}/runs/${run.id}` }, run.state)),
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
                        React.DOM.span({ className: 'state ' + run.state }, React.DOM.a({ href: `/agents/${this.props.id}/runs/${run.id}` }, run.state)),
                        React.DOM.div({ className: 'info' }, ...info)
                    ]
                    return React.DOM.li({ className: run.state }, ...fields)
                }
                else if (run.state === 'failure') {
                    const info = [
                        React.DOM.span({ className: 'initiator' }, run.initiator),
                        React.DOM.span({ className: 'date', title: Moment(run.dateStarted).format('LLL') }, 'ran ' + Moment(run.dateStarted).fromNow()),
                        React.DOM.span({ className: 'duration', title: run.duration + 'ms' }, 'took ' + Moment.duration(run.duration).humanize())
                    ]
                    const fields = [
                        React.DOM.span({ className: 'state ' + run.state }, React.DOM.a({ href: `/agents/${this.props.id}/runs/${run.id}` }, run.state)),
                        React.DOM.div({ className: 'info' }, ...info)
                    ]
                    return React.DOM.li({ className: run.state }, ...fields)
                }
                else {
                    const records = run.recordsAdded === 0 && run.recordsRemoved === 0
                          ? 'nothing changed'
                          : 'added ' + run.recordsAdded.toLocaleString() + ', removed ' + run.recordsRemoved.toLocaleString()
                    const triggered = run.triggered.map(trigger => {
                        const status = [
                            React.DOM.span({ className: 'type' }, trigger.type),
                            React.DOM.span({ className: 'recipient' }, trigger.recipient),
                            React.DOM.span({ className: 'status' }, trigger.status)
                        ]
                        return React.DOM.li({}, ...status)
                    })
                    const info = [
                        React.DOM.span({ className: 'initiator' }, run.initiator),
                        React.DOM.span({ className: 'date', title: Moment(run.dateStarted).format('LLL') }, 'ran ' + Moment(run.dateStarted).fromNow()),
                        React.DOM.span({ className: 'duration', title: run.duration + 'ms' }, 'took ' + Moment.duration(run.duration).humanize()),
                        React.DOM.span({ className: 'records' }, records)
                    ]
                    const buttons = [
                        React.DOM.button({ onClick: () => this.setState({ viewing: run }) }, 'View'),
                        React.DOM.button({ onClick: this.download(run.id) }, 'Download')
                    ]
                    const fields = [
                        React.DOM.span({ className: 'state ' + run.state }, React.DOM.a({ href: `/agents/${this.props.id}/runs/${run.id}` }, run.state)),
                        React.DOM.div({ className: 'info' }, ...info),
                        React.DOM.div({ className: 'buttons' }, ...buttons),
                        run.triggered.length > 0 ? React.DOM.ol({ className: 'triggered' }, ...triggered) : null
                    ]
                    return React.DOM.li({ className: run.state }, ...fields)
                }
            })
            const list = React.DOM.ol({}, ...items)
            const unhide = this.state.hidden === 0
                  ? ''
                  : React.DOM.button({ onClick: this.unhide, className: 'secondary unhide' }, `Show ${this.state.hidden.toLocaleString()} more...`)
            const view = !this.state.viewing ? null : React.createElement(RunDataView, {
                id: this.props.id,
                run: this.state.viewing.id,
                date: this.state.viewing.date,
                close: () => this.setState({ viewing: null })
            })
            return React.DOM.div({ className: 'agent-page-runs', ref: node => this.node = node }, ...[
                React.DOM.h3({}, 'Runs'),
                list,
                unhide,
                view
            ])
        }
    }

}
