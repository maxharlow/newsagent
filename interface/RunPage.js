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
            const timeout = setTimeout(this.load, 1 * 1000)
            this.setState({ timeout })
        }
        const update = response => {
            const timeout = setTimeout(this.load, 1 * 1000) // in seconds
            this.setState(Object.assign({ timeout }, response))
        }
        HTTP.get(Config.registry + '/agents/' + this.props.agent + '/runs/' + this.props.run).then(update).catch(retry)
    }

    render() {
        if (this.state === null) return React.DOM.div({ className: 'loading' }, '')
        const date = this.state.run.dateStarted ? this.state.run.dateStarted : this.state.run.dateQueued
        const title = React.DOM.h2({}, React.DOM.a({ href: '/' }, 'Agents'),
                                   ' ▸ ', React.DOM.a({ href: `/agents/${this.props.agent}` }, this.state.recipe.name),
                                   ' ▸ ', React.DOM.a({ href: `/agents/${this.props.agent}/runs/${date}` }, Moment(date).format('LLL')))
        const hr = React.DOM.hr({})
        const state = React.DOM.span({ className: 'state ' + this.state.run.state }, this.state.run.state)
        const execution = React.createElement(RunPageExecution, { agent: this.props.agent, run: this.props.run, state: this.state.run.state })
        return React.DOM.div({ className: 'run-page' }, title, hr, state, execution)
    }

}
