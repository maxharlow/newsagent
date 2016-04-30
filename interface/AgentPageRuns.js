import React from 'react'
import Moment from 'moment'
import HTTP from '/HTTP.js'
import Config from '/config.js'

export default class AgentPageRuns extends React.Component {

    constructor() {
        super()
        this.state = { loading: false }
        this.load = this.load.bind(this)
    }

    componentDidMount() {
        if (this.props.state === 'started') this.load()
    }

    load() {
        this.setState({ loading: true })
        HTTP.get(Config.registry + '/agents/' + this.props.id + '/runs', (e, response) => {
            if (!e) this.setState({ runs: response, loading: false })
        })
    }

    render() {
        if (this.state.runs && this.state.runs.length > 0) {
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
                    const messages = run.messages.map(message => {
                        return React.DOM.span({ className: message.type }, message.value)
                    })
                    const triggered = run.triggered.map(sent => {
                        return React.DOM.li({}, React.DOM.span({}, sent.type), React.DOM.span({}, sent.recipient), React.DOM.span({}, sent.status))
                    })
                    const fields = [
                        React.DOM.span({ className: 'date', title: run.date }, Moment(run.date).fromNow()),
                        React.DOM.span({ className: 'state ' + run.state }, run.state),
                        React.DOM.span({ className: 'duration', title: run.duration + 'ms' }, 'took ' + Moment.duration(run.duration).humanize()),
                        React.DOM.span({ className: 'records' }, 'added ' + run.recordsAdded + ', removed ' + run.recordsRemoved),
                        React.DOM.code({ className: 'messages' }, messages),
                        React.DOM.ol({ className: 'triggered' }, triggered)
                    ]
                    return React.DOM.li({}, ...fields)
                }
            })
            const list = React.DOM.ol({}, ...items)
            return React.DOM.div({ className: 'section runs' }, React.DOM.h3({}, 'Runs'), React.DOM.hr({}), list)
        }
        else if (this.state.loading) {
            const loading = React.DOM.div({ className: 'loading' })
            return React.DOM.div({ className: 'section runs' }, React.DOM.h3({}, 'Runs'), loading)
        }
        else return React.DOM.div({ className: 'section runs' }, React.DOM.h3({}, 'Runs'), React.DOM.hr({}), 'This agent has not run yet.')
    }

}
