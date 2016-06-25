import React from 'react'
import Moment from 'moment'
import AgentPageDelete from '/AgentPageDelete.js'
import AgentPageRecipe from '/AgentPageRecipe.js'
import AgentPageRuns from '/AgentPageRuns.js'
import AgentPageBuild from '/AgentPageBuild.js'
import HTTP from '/HTTP.js'
import Config from '/config.js'

export default class AgentPage extends React.Component {

    constructor() {
        super()
        this.load = this.load.bind(this)
    }

    componentWillMount() {
        this.load()
    }

    componentWillUnmount() {
        if (this.state && this.state.timeout) clearTimeout(this.state.timeout)
    }

    load() {
        HTTP.get(Config.registry + '/agents/' + this.props.id).then(response => {
            const timeout = setTimeout(this.load, 1 * 1000) // in seconds
            this.setState(response)
        })
    }

    render() {
        if (this.state === null) return React.DOM.div({ className: 'loading' }, '')
        const summarise = (title, value) => React.DOM.span({ className: 'summary' }, React.DOM.span({ className: 'title' }, title), value)
        const title = React.DOM.h2({}, 'Agent ' + this.state.recipe.name)
        const description = React.DOM.p({ className: 'description' }, this.state.recipe.description)
        const hr = React.DOM.hr({})
        const deleteButton = React.createElement(AgentPageDelete, { id: this.props.id })
        const summaryBuiltDate = summarise('Built: ', Moment(this.state.builtDate).format('LLL'))
        const recipe = React.createElement(AgentPageRecipe, { recipe: this.state.recipe, state: this.state.state })
        if (this.state.state === 'starting') {
            const message = React.DOM.div({ className: 'starting message' }, 'This agent is starting up...')
            const build = React.createElement(AgentPageBuild, { id: this.props.id, state: this.state.state })
            return React.DOM.div({ className: 'agent-page' }, title, description, hr, message, recipe, build)
        }
        else if (this.state.state === 'failed') {
            const message = React.DOM.div({ className: 'failed message' }, 'This agent failed to build.')
            const build = React.createElement(AgentPageBuild, { id: this.props.id, state: this.state.state })
            return React.DOM.div({ className: 'agent-page' }, deleteButton, title, description, hr, summaryBuiltDate, message, recipe, build)
        }
        else {
            const summary = [
                summaryBuiltDate,
                this.state.status.averageRunTime ? summarise('Average run time: ', Moment.duration(this.state.status.averageRunTime).humanize()) : '',
                summarise('Total runs: ', this.state.status.numberRuns || 0),
                this.state.status.numberRuns > 0 ? summarise('Successful runs: ', this.state.status.numberRunsSuccessful || 0) : '',
                this.state.status.numberRuns > 0 ? summarise('Success rate: ', (this.state.status.successRate || 0) + '%') : '',
                this.state.status.dateLastSuccessfulRun ? summarise('Last successful run: ', Moment(this.state.status.dateLastSuccessfulRun).fromNow()) : '',
                this.state.spaceUsed ? summarise('Space used: ', this.state.spaceUsed + ' MB') : ''
            ]
            const runs = React.createElement(AgentPageRuns, { id: this.props.id })
            const build = React.createElement(AgentPageBuild, { id: this.props.id, state: this.state.state })
            return React.DOM.div({ className: 'agent-page' }, deleteButton, title, description, hr, ...summary, recipe, runs, build)
        }
    }

}
