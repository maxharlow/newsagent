import React from 'react'
import HTML from 'react-dom-factories'
import Moment from 'moment'
import RunDataView from '/RunDataView.js'
import RunDataDownload from '/RunDataDownload.js'
import Config from '/Config.js'

export default class AgentPageRuns extends React.Component {

    constructor() {
        super()
        this.load = this.load.bind(this)
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
        fetch(Config.registry + '/agents/' + this.props.id + '/runs')
            .then(response => response.json())
            .then(update)
            .catch(abort)
    }

    unhide() {
        this.setState({ hidden: 0 })
    }

    render() {
        if (this.state === null) {
            const loading = HTML.div({ className: 'loading' })
            return HTML.div({ className: 'agent-page-runs', ref: node => this.node = node }, HTML.h3({}, 'Runs'), loading)
        }
        else if (this.state.runs === undefined || this.state.runs.length === 0) {
            const message = HTML.span({ className: 'not-yet' }, 'This agent has not run yet.')
            return HTML.div({ className: 'agent-page-runs', ref: node => this.node = node }, HTML.h3({}, 'Runs'), message)
        }
        else {
            const keys = Object.keys(this.state.runs)
            const keysLimited = keys.slice(0, keys.length - this.state.hidden)
            const items = keysLimited.map(i => {
                const run = this.state.runs[i]
                if (run.state === 'queued') {
                    const info = [
                        HTML.span({ className: 'initiator' }, run.initiator)
                    ]
                    const fields = [
                        HTML.span({ className: 'state ' + run.state }, HTML.a({ href: `/agents/${this.props.id}/runs/${run.id}` }, run.state)),
                        HTML.div({ className: 'info' }, ...info)
                    ]
                    return HTML.li({ className: run.state }, ...fields)
                }
                else if (run.state === 'running') {
                    const info = [
                        HTML.span({ className: 'initiator' }, run.initiator),
                        HTML.span({ className: 'date', title: Moment(run.dateStarted).format('LLL') }, 'started ' + Moment(run.dateStarted).fromNow())
                    ]
                    const fields = [
                        HTML.span({ className: 'state ' + run.state }, HTML.a({ href: `/agents/${this.props.id}/runs/${run.id}` }, run.state)),
                        HTML.div({ className: 'info' }, ...info)
                    ]
                    return HTML.li({ className: run.state }, ...fields)
                }
                else if (run.state === 'failure') {
                    const info = [
                        HTML.span({ className: 'initiator' }, run.initiator),
                        HTML.span({ className: 'date', title: Moment(run.dateStarted).format('LLL') }, 'ran ' + Moment(run.dateStarted).fromNow()),
                        HTML.span({ className: 'duration', title: run.duration + 'ms' }, 'took ' + Moment.duration(run.duration).humanize())
                    ]
                    const fields = [
                        HTML.span({ className: 'state ' + run.state }, HTML.a({ href: `/agents/${this.props.id}/runs/${run.id}` }, run.state)),
                        HTML.div({ className: 'info' }, ...info)
                    ]
                    return HTML.li({ className: run.state }, ...fields)
                }
                else {
                    const records = run.recordsAdded === 0 && run.recordsRemoved === 0
                          ? 'nothing changed'
                          : 'added ' + run.recordsAdded.toLocaleString() + ', removed ' + run.recordsRemoved.toLocaleString()
                    const triggered = run.triggered.map(trigger => {
                        const status = [
                            HTML.span({ className: 'type' }, trigger.type),
                            HTML.span({ className: 'recipient' }, trigger.recipient),
                            HTML.span({ className: 'status' }, trigger.status)
                        ]
                        return HTML.li({}, ...status)
                    })
                    const info = [
                        HTML.span({ className: 'initiator' }, run.initiator),
                        HTML.span({ className: 'date', title: Moment(run.dateStarted).format('LLL') }, 'ran ' + Moment(run.dateStarted).fromNow()),
                        HTML.span({ className: 'duration', title: run.duration + 'ms' }, 'took ' + Moment.duration(run.duration).humanize()),
                        HTML.span({ className: 'records' }, records)
                    ]
                    const buttons = [
                        HTML.button({ onClick: () => this.setState({ viewing: run }) }, 'View'),
                        HTML.button({ onClick: () => this.setState({ downloading: run }) }, 'Download')
                    ]
                    const fields = [
                        HTML.span({ className: 'state ' + run.state }, HTML.a({ href: `/agents/${this.props.id}/runs/${run.id}` }, run.state)),
                        HTML.div({ className: 'info' }, ...info),
                        HTML.div({ className: 'buttons' }, ...buttons),
                        run.triggered.length > 0 ? HTML.ol({ className: 'triggered' }, ...triggered) : null
                    ]
                    return HTML.li({ className: run.state }, ...fields)
                }
            })
            const list = HTML.ol({}, ...items)
            const unhide = this.state.hidden === 0
                  ? ''
                  : HTML.button({ onClick: this.unhide, className: 'secondary unhide' }, `Show ${this.state.hidden.toLocaleString()} more...`)
            const view = !this.state.viewing ? null : React.createElement(RunDataView, {
                id: this.props.id,
                run: this.state.viewing.id,
                date: this.state.viewing.dateStarted,
                records: this.state.viewing.records,
                recordsAdded: this.state.viewing.recordsAdded,
                recordsRemoved: this.state.viewing.recordsRemoved,
                close: () => this.setState({ viewing: null })
            })
            const download = !this.state.downloading ? null : React.createElement(RunDataDownload, {
                id: this.props.id,
                run: this.state.downloading.id,
                date: this.state.downloading.dateStarted,
                records: this.state.downloading.records,
                recordsAdded: this.state.downloading.recordsAdded,
                recordsRemoved: this.state.downloading.recordsRemoved,
                close: () => this.setState({ downloading: null })
            })
            return HTML.div({ className: 'agent-page-runs', ref: node => this.node = node }, ...[
                HTML.h3({}, 'Runs'),
                list,
                unhide,
                view,
                download
            ])
        }
    }

}
