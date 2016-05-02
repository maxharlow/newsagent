import React from 'react'
import AgentPageRecipe from '/AgentPageRecipe.js'
import AgentPageRuns from '/AgentPageRuns.js'
import AgentPageBuildLog from '/AgentPageBuildLog.js'
import AgentPageDeletion from '/AgentPageDeletion.js'
import HTTP from '/HTTP.js'
import Config from '/config.js'

export default class AgentPage extends React.Component {

    constructor() {
        super()
        this.load = this.load.bind(this)
    }

    componentDidMount() {
        this.load()
    }

    load() {
        HTTP.get(Config.registry + '/agents/' + this.props.id, (e, response) => {
            if (!e) this.setState(response)
            setTimeout(this.load, 1 * 1000) // in seconds
        })
    }

    render() {
        if (this.state === null) return React.DOM.div({ className: 'loading' }, '')
        const headerElements = [
            React.DOM.h2({}, this.state.recipe.name),
            React.DOM.p({}, this.state.recipe.description)
        ]
        const header = React.DOM.div({ className: 'header' }, ...headerElements)
        const recipe = React.createElement(AgentPageRecipe, this.state.recipe)
        const deletion = React.createElement(AgentPageDeletion, { id: this.props.id })
        if (this.state.state === 'starting') {
            const message = React.DOM.div({ className: 'section message' }, 'This agent is currently loading...')
            const buildLog = React.createElement(AgentPageBuildLog, { id: this.props.id, state: this.state.state })
            const body = React.DOM.div({ className: 'body' }, recipe, message, buildLog)
            return React.DOM.div({ className: 'agent page' }, header, body)
        }
        else if (this.state.state === 'failed') {
            const message = React.DOM.div({ className: 'section message' }, 'This agent failed to load.')
            const body = React.DOM.div({ className: 'body' }, recipe, deletion, message)
            return React.DOM.div({ className: 'agent page' }, header, body)
        }
        else {
            const runs = React.createElement(AgentPageRuns, { id: this.props.id, state: this.state.state })
            const buildLog = React.createElement(AgentPageBuildLog, { id: this.props.id, state: this.state.state })
            const body = React.DOM.div({ className: 'body' }, recipe, deletion, runs, buildLog)
            return React.DOM.div({ className: 'agent page' }, header, body)
        }
    }

}
