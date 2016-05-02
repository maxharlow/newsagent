import React from 'react'
import Moment from 'moment'
import HTTP from '/HTTP.js'
import Config from '/config.js'

export default class AgentPageRuns extends React.Component {

    constructor() {
        super()
        this.load = this.load.bind(this)
        this.download = this.download.bind(this)
    }

    componentDidMount() {
        if (this.props.state === 'started') this.load()
    }

    load() {
        HTTP.get(Config.registry + '/agents/' + this.props.id + '/runs', (e, response) => {
            if (!e) this.setState({ runs: response })
            setTimeout(this.load, 1 * 1000) // in seconds
        })
    }

    download(run) {
        return () => {
            HTTP.get(Config.registry + '/agents/' + this.props.id + '/runs/' + run, (e, response) => {
                if (!e) {
                    const anchor = document.createElement('a')
                    anchor.setAttribute('href', 'data:application/json;charset=utf-8,' + JSON.stringify(response))
                    anchor.setAttribute('download', 'datastash-' + run + '.json')
                    document.body.appendChild(anchor)
                    anchor.click()
                }
            })
        }
    }

    render() {
        if (this.state === null) {
            const loading = React.DOM.div({ className: 'loading' })
            return React.DOM.div({ className: 'section runs' }, React.DOM.h3({}, 'Runs'), loading)
        }
        else if (this.state.runs === undefined || this.state.runs.length === 0) {
            return React.DOM.div({ className: 'section runs' }, React.DOM.h3({}, 'Runs'), React.DOM.hr({}), 'This agent has not run yet.')
        }
        else {
            const items = Object.keys(this.state.runs).map(i => {
                const run = this.state.runs[i]
                if (run.state === 'system-error') {
                    const fields = [
                        React.DOM.span({ className: 'date', title: run.date }, Moment(run.date).fromNow()),
                        React.DOM.span({ className: 'state ' + run.state }, run.state),
                        React.DOM.span({ className: 'duration', title: run.duration + 'ms' }, 'took ' + Moment.duration(run.duration).humanize()),
                        React.DOM.code({ className: 'messages' }, run.message)
                    ]
                    return React.DOM.li({}, ...fields)
                }
                else {
                    const records = run.recordsAdded === 0 && run.recordsRemoved === 0
                          ? 'nothing changed'
                          : 'added ' + run.recordsAdded + ', removed ' + run.recordsRemoved
                    const messages = run.messages.map(message => {
                        return React.DOM.span({ className: message.type }, message.value)
                    })
                    const triggered = run.triggered.map(sent => {
                        const fields = [
                            React.DOM.span({ className: 'type' }, sent.type),
                            React.DOM.span({ className: 'recipient' }, sent.recipient),
                            React.DOM.span({ className: 'status' }, sent.status)
                        ]
                        return React.DOM.li({}, fields)
                    })
                    const info = [
                        React.DOM.span({ className: 'date', title: run.date }, Moment(run.date).fromNow()),
                        React.DOM.span({ className: 'state ' + run.state }, run.state),
                        React.DOM.span({ className: 'duration', title: run.duration + 'ms' }, 'took ' + Moment.duration(run.duration).humanize()),
                        React.DOM.span({ className: 'records' }, records)
                    ]
                    const fields = [
                        React.DOM.div({ className: 'info' }, ...info),
                        React.DOM.button({ onClick: this.download(run.id) }, 'Download'),
                        React.DOM.code({ className: 'messages' }, messages),
                        React.DOM.ol({ className: 'triggered' }, triggered)
                    ]
                    return React.DOM.li({}, ...fields)
                }
            })
            const list = React.DOM.ol({}, ...items)
            return React.DOM.div({ className: 'section runs' }, React.DOM.h3({}, 'Runs'), React.DOM.hr({}), list)
        }
    }

}
