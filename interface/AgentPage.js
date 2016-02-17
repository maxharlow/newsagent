import React from 'react'
import PrettyCron from 'prettycron'
import AgentPageBuildLog from 'AgentPageBuildLog.js'
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
            const recipeElements = [
                React.DOM.h3({}, 'Recipe'),
                React.DOM.p({}, 'Runs at ' + PrettyCron.toString(this.state.recipe.schedule).toLowerCase() + '. Next run is ' + PrettyCron.getNext(this.state.recipe.schedule).toLowerCase() + '.'),
                React.DOM.h4({}, 'Location'),
                React.DOM.code({}, this.state.recipe.location),
                React.DOM.span({ className: 'note' }, this.state.recipe.updatable ? 'Updates are ON.' : 'Updates are OFF.'),
                React.DOM.h4({}, 'Setup'),
                this.state.recipe.setup.length > 0
                    ? React.DOM.code({}, React.DOM.ol({}, ...this.state.recipe.setup.map(step => React.DOM.li({}, step))))
                    : React.DOM.span({ className: 'note' }, 'This agent has no setup.'),
                React.DOM.h4({}, 'Run'),
                React.DOM.code({}, React.DOM.ol({}, ...this.state.recipe.run.map(step => React.DOM.li({}, step)))),
                React.DOM.h4({}, 'Result'),
                React.DOM.code({}, this.state.recipe.result),
                React.DOM.h4({}, 'Alerts'),
                React.DOM.ul({ className: 'alerts' }, ...this.state.recipe.alerts.map(alert => React.DOM.li({}, alert.recipient)))
            ]
            const recipe = React.DOM.div({ className: 'section' }, ...recipeElements)
            const buildLog = this.state.state !== 'started' ? undefined : React.createElement(AgentPageBuildLog, { id: this.props.id })
            const buttonBarElements = [
                React.DOM.button({ disabled: this.state.state !== 'started' }, 'Delete')
            ]
            const buttonBar = React.DOM.div({ className: 'section' }, ...buttonBarElements)
            const body = React.DOM.div({ className: 'body' }, state, recipe, buildLog, buttonBar)
            return React.DOM.div({ className: 'agent page' }, header, body)
        }
        else return React.DOM.div({ className: 'loading' }, '')
    }

}
