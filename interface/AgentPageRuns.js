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
        if (this.state.runs) {
            const items = Object.keys(this.state.runs).map(i => {
                const fields = [
                    React.DOM.span({ className: 'date', title: this.state.runs[i].date }, Moment(this.state.runs[i].date).fromNow()),
                    React.DOM.span({ className: 'state ' + this.state.runs[i].state }, this.state.runs[i].state),
                    React.DOM.span({ className: 'duration', title: this.state.runs[i].duration + 'ms' }, 'took ' + Moment.duration(this.state.runs[i].duration).humanize()),
                    React.DOM.span({ className: 'records' }, 'added ' + this.state.runs[i].recordsAdded + ', removed ' + this.state.runs[i].recordsRemoved)
                ]
                return React.DOM.li({}, ...fields)
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
