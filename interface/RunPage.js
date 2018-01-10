import React from 'react'
import HTML from 'react-dom-factories'
import Moment from 'moment'
import MomentDurationFormat from 'moment-duration-format'
import RunPageExecution from '/RunPageExecution.js'
import Config from '/Config.js'

export default class RunPage extends React.Component {

    constructor() {
        super()
        this.load = this.load.bind(this)
    }

    shouldComponentUpdate(_, nextState) {
        return JSON.stringify(this.state) !== JSON.stringify(nextState)
    }

    componentWillMount() {
        this.load()
    }

    load() {
        const retry = () => {
            if (!this.node) return
            const timeout = setTimeout(this.load, 1 * 1000) // in milliseconds
            this.setState({ timeout })
        }
        const update = response => {
            if (!this.node) return
            const timeout = setTimeout(this.load, 1 * 1000) // in milliseconds
            this.setState(Object.assign({ timeout }, response))
        }
        fetch(Config.registry + '/agents/' + this.props.agent + '/runs/' + this.props.run)
            .then(response => response.json())
            .then(update)
            .catch(retry)
    }

    render() {
        if (this.state === null) return HTML.div({ className: 'run-page', ref: node => this.node = node }, ...[
            HTML.div({ className: 'loading' })
        ])
        const summarise = (title, value) => HTML.span({ className: 'summary' }, HTML.span({ className: 'title' }, title), value)
        const summary = [
            summarise('Initiator: ', this.state.run.initiator),
            this.state.run.duration === undefined && this.state.run.dateStarted
                ? summarise('Duration: ', Moment.duration(new Date() - new Date(this.state.run.dateStarted), 'ms').format('h[h] m[m] s[s]'))
                : null,
            this.state.run.duration ? summarise('Duration: ', Moment.duration(this.state.run.duration, 'ms').format('h[h] m[m] s[s]')) : null,
            this.state.run.recordsAdded !== undefined ? summarise('Records added: ', this.state.run.recordsAdded) : null,
            this.state.run.recordsRemoved !== undefined ? summarise('Records removed: ', this.state.run.recordsRemoved) : null,
            this.state.run.triggered !== undefined ? summarise('Triggers fired: ', this.state.run.triggered.length) : null
        ]
        const date = this.state.run.dateStarted ? this.state.run.dateStarted : this.state.run.dateQueued
        const breadcrumbs = HTML.div({ className: 'breadcrumbs' },
                                          HTML.a({ href: '/' }, 'Agents'),
                                          HTML.a({ href: `/agents/${this.props.agent}` }, this.state.recipe.name))
        const title = HTML.h2({}, Moment(date).format('LLL'))
        const hr = HTML.hr({})
        const state = HTML.span({ className: 'state ' + this.state.run.state }, this.state.run.state)
        const execution = React.createElement(RunPageExecution, { agent: this.props.agent, run: this.props.run, state: this.state.run.state })
        return HTML.div({ className: 'run-page', ref: node => this.node = node }, ...[
            breadcrumbs,
            title,
            hr,
            state,
            ...summary,
            execution
        ])
    }

}
