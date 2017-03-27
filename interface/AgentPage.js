import React from 'react'
import Moment from 'moment'
import AgentPageEdit from '/AgentPageEdit.js'
import AgentPageDelete from '/AgentPageDelete.js'
import AgentPageRecipe from '/AgentPageRecipe.js'
import AgentPageRuns from '/AgentPageRuns.js'
import AgentPageBuild from '/AgentPageBuild.js'
import HTTP from '/HTTP.js'
import Config from '/Config.js'

export default class AgentPage extends React.Component {

    constructor() {
        super()
        this.load = this.load.bind(this)
        this.run = this.run.bind(this)
    }

    shouldComponentUpdate(_, nextState) {
        const withoutTimeout = object => Object.assign({}, object, { timeout: null })
        return JSON.stringify(withoutTimeout(this.state)) !== JSON.stringify(withoutTimeout(nextState))
    }

    componentWillMount() {
        this.load()
    }

    load() {
        const abort = error => {
            console.error('Could not load agent', error)
        }
        const update = response => {
            if (!this.node) return
            const timeout = setTimeout(this.load, 1 * 1000) // in milliseconds
            this.setState(Object.assign({ timeout }, response))
        }
        HTTP.get(Config.registry + '/agents/' + this.props.id).then(update).catch(abort)
    }

    run() {
        this.setState({ runDisabled: true })
        const abort = error => {
            this.setState({ runDisabled: false })
            console.error('Could not run agent', error)
        }
        HTTP.post(Config.registry + '/agents/' + this.props.id).catch(abort)
    }

    render() {
        if (this.state === null) return React.DOM.div({ className: 'agent-page', ref: node => this.node = node }, ...[
            React.DOM.div({ className: 'loading' })
        ])
        const summarise = (title, value) => React.DOM.span({ className: 'summary' }, React.DOM.span({ className: 'title' }, title), value)
        const breadcrumbs = React.DOM.div({ className: 'breadcrumbs' }, React.DOM.a({ href: '/' }, 'Agents'))
        const title = React.DOM.h2({}, this.state.recipe.name)
        const description = React.DOM.p({ className: 'description' }, this.state.recipe.description)
        const hr = React.DOM.hr({})
        const runButton = React.DOM.button({ className: 'run', onClick: this.run, disabled: this.state.runDisabled }, 'Run now')
        const editButton = React.createElement(AgentPageEdit, { id: this.props.id, recipe: this.state.recipe })
        const deleteButton = React.createElement(AgentPageDelete, { id: this.props.id })
        const summaryBuiltDate = summarise('Built: ', Moment(this.state.builtDate).format('LLL'))
        const recipe = React.createElement(AgentPageRecipe, { recipe: this.state.recipe, state: this.state.state })
        if (this.state.state === 'starting') {
            const message = React.DOM.div({ className: 'starting message' }, 'This agent is starting up...')
            const build = React.createElement(AgentPageBuild, { id: this.props.id, state: this.state.state })
            return React.DOM.div({ className: 'agent-page', ref: node => this.node = node }, ...[
                breadcrumbs,
                title,
                description,
                hr,
                message,
                recipe,
                build
            ])
        }
        else if (this.state.state === 'failed') {
            const buttons = React.DOM.div({ className: 'buttons' }, deleteButton)
            const message = React.DOM.div({ className: 'failed message' }, 'This agent failed to build.')
            const build = React.createElement(AgentPageBuild, { id: this.props.id, state: this.state.state })
            return React.DOM.div({ className: 'agent-page', ref: node => this.node = node }, ...[
                breadcrumbs,
                title,
                description,
                buttons,
                hr,
                summaryBuiltDate,
                message,
                recipe,
                build
            ])
        }
        else {
            const buttons = React.DOM.div({ className: 'buttons' }, deleteButton, editButton, runButton)
            const summary = [
                summaryBuiltDate,
                this.state.status.averageRunTime ? summarise('Average run time: ', Moment.duration(this.state.status.averageRunTime).humanize()) : null,
                summarise('Total runs: ', this.state.status.numberRuns || 0),
                this.state.status.numberRuns > 0 ? summarise('Successful runs: ', this.state.status.numberRunsSuccessful || 0) : null,
                this.state.status.numberRuns > 0 ? summarise('Success rate: ', (this.state.status.successRate || 0) + '%') : null,
                this.state.status.dateLastSuccessfulRun ? summarise('Last successful run: ', Moment(this.state.status.dateLastSuccessfulRun).fromNow()) : null,
                this.state.spaceUsed ? summarise('Space used: ', Math.round(this.state.spaceUsed) + ' MB') : null
            ]
            const setRunDisabled = runDisabled => this.setState({ runDisabled })
            const runs = React.createElement(AgentPageRuns, { id: this.props.id, setRunDisabled })
            const build = React.createElement(AgentPageBuild, { id: this.props.id, state: this.state.state })
            return React.DOM.div({ className: 'agent-page', ref: node => this.node = node }, ...[
                breadcrumbs,
                title,
                description,
                buttons,
                hr,
                ...summary,
                recipe,
                runs,
                build
            ])
        }
    }

}
