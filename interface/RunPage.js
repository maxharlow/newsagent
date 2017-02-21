import React from 'react'
import Moment from 'moment'
import RunPageExecution from '/RunPageExecution.js'
import HTTP from '/HTTP.js'
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

    componentWillUnmount() {
        if (this.state && this.state.timeout) clearTimeout(this.state.timeout)
    }

    load() {
        const retry = () => {
            const timeout = setTimeout(this.load, 1 * 1000) // in milliseconds
            this.setState({ timeout })
        }
        const update = response => {
            const timeout = setTimeout(this.load, 1 * 1000) // in milliseconds
            this.setState(Object.assign({ timeout }, response))
        }
        HTTP.get(Config.registry + '/agents/' + this.props.agent + '/runs/' + this.props.run).then(update).catch(retry)
    }

    render() {
        if (this.state === null) return React.DOM.div({ className: 'loading' }, '')
        const summarise = (title, value) => React.DOM.span({ className: 'summary' }, React.DOM.span({ className: 'title' }, title), value)
        const summary = [
            summarise('Initiator: ', this.state.run.initiator),
            this.state.run.duration === undefined && this.state.run.dateStarted
                ? summarise('Duration: ', Math.round(Moment.duration(new Date() - new Date(this.state.run.dateStarted)).asSeconds()) + 's') : null,
            this.state.run.duration ? summarise('Duration: ', Moment.duration(this.state.run.duration).humanize()) : null,
            this.state.run.recordsAdded !== undefined ? summarise('Records added: ', this.state.run.recordsAdded) : null,
            this.state.run.recordsRemoved !== undefined ? summarise('Records removed: ', this.state.run.recordsRemoved) : null,
            this.state.run.triggered !== undefined ? summarise('Triggers fired: ', this.state.run.triggered.length) : null
        ]
        const date = this.state.run.dateStarted ? this.state.run.dateStarted : this.state.run.dateQueued
        const breadcrumbs = React.DOM.div({ className: 'breadcrumbs' },
                                          React.DOM.a({ href: '/' }, 'Agents'), ' ▸ ',
                                          React.DOM.a({ href: `/agents/${this.props.agent}` }, this.state.recipe.name), ' ▸ ')
        const title = React.DOM.h2({}, Moment(date).format('LLL'))
        const hr = React.DOM.hr({})
        const state = React.DOM.span({ className: 'state ' + this.state.run.state }, this.state.run.state)
        const execution = React.createElement(RunPageExecution, { agent: this.props.agent, run: this.props.run, state: this.state.run.state })
        return React.DOM.div({ className: 'run-page' }, breadcrumbs, title, hr, state, ...summary, execution)
    }

}
