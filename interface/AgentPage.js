import React from 'react'
import AgentPageRecipe from 'AgentPageRecipe.js'
import AgentPageBuildLog from 'AgentPageBuildLog.js'
import AgentPageDeletion from 'AgentPageDeletion.js'
import HTTP from 'HTTP.js'

export default class AgentPage extends React.Component {

    componentWillMount() {
        const registry = 'http://localhost:8000' // todo extract to config
        HTTP.get(registry + '/agents/' + this.props.id, (e, response) => {
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
            const state = this.state.state === 'starting' ? React.DOM.div({ className: 'section state creating' }, 'This agent is still being built.')
                  : this.state.state === 'failed' ? React.DOM.div({ className: 'section state failed' }, 'This agent failed to start.')
                  : undefined
            const recipe = React.createElement(AgentPageRecipe, this.state.recipe)
            const buildLog = this.state.state !== 'started' ? undefined : React.createElement(AgentPageBuildLog, { id: this.props.id })
            const deletion = React.createElement(AgentPageDeletion, { state: this.state.state })
            const body = React.DOM.div({ className: 'body' }, state, recipe, buildLog, deletion)
            return React.DOM.div({ className: 'agent page' }, header, body)
        }
        else return React.DOM.div({ className: 'loading' }, '')
    }

}
