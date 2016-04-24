import React from 'react'
import AgentPageRecipe from '/AgentPageRecipe.js'
import AgentPageRuns from '/AgentPageRuns.js'
import AgentPageBuildLog from '/AgentPageBuildLog.js'
import AgentPageDeletion from '/AgentPageDeletion.js'
import HTTP from '/HTTP.js'
import Config from '/config.js'

export default class AgentPage extends React.Component {

    componentWillMount() {
        HTTP.get(Config.registry + '/agents/' + this.props.id, (e, response) => {
            if (!e) this.setState(response)
        })
    }

    render() {
        if (this.state) {
            const headerElements = [
                React.DOM.h2({}, this.state.recipe.name),
                React.DOM.p({}, this.state.recipe.description)
            ]
            const header = React.DOM.div({ className: 'header' }, ...headerElements)
            const state = this.state.state === 'starting' ? React.DOM.div({ className: 'section state creating' }, 'This agent is being built.')
                  : this.state.state === 'failed' ? React.DOM.div({ className: 'section state failed' }, 'This agent failed to start.')
                  : undefined
            const recipe = React.createElement(AgentPageRecipe, this.state.recipe)
            const runs = React.createElement(AgentPageRuns, { id: this.props.id, state: this.state.state })
            const buildLog = React.createElement(AgentPageBuildLog, { id: this.props.id, state: this.state.state })
            const deletion = React.createElement(AgentPageDeletion, { id: this.props.id, state: this.state.state })
            const body = React.DOM.div({ className: 'body' }, state, recipe, runs, buildLog, deletion)
            return React.DOM.div({ className: 'agent page' }, header, body)
        }
        else return React.DOM.div({ className: 'loading' }, '')
    }

}
