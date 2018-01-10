import React from 'react'
import HTML from 'react-dom-factories'
import Moment from 'moment'
import AgentPageEdit from '/AgentPageEdit.js'
import AgentPageDelete from '/AgentPageDelete.js'
import AgentPageRecipe from '/AgentPageRecipe.js'
import AgentPageRuns from '/AgentPageRuns.js'
import AgentPageBuild from '/AgentPageBuild.js'
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
        fetch(Config.registry + '/agents/' + this.props.id)
            .then(response => response.json())
            .then(update)
            .catch(abort)
    }

    run() {
        this.setState({ runDisabled: true })
        const abort = error => {
            this.setState({ runDisabled: false })
            console.error('Could not run agent', error)
        }
        fetch(Config.registry + '/agents/' + this.props.id, { method: 'POST' }).catch(abort)
    }

    render() {
        if (this.state === null) return HTML.div({ className: 'agent-page', ref: node => this.node = node }, ...[
            HTML.div({ className: 'loading' })
        ])
        const summarise = (title, value) => HTML.span({ className: 'summary' }, HTML.span({ className: 'title' }, title), value)
        const breadcrumbs = HTML.div({ className: 'breadcrumbs' }, HTML.a({ href: '/' }, 'Agents'))
        const title = HTML.h2({}, this.state.recipe.name)
        const description = HTML.p({ className: 'description' }, this.state.recipe.description)
        const hr = HTML.hr({})
        const runButton = HTML.button({ className: 'run', onClick: this.run, disabled: this.state.runDisabled }, 'Run now')
        const editButton = React.createElement(AgentPageEdit, { id: this.props.id, recipe: this.state.recipe })
        const deleteButton = React.createElement(AgentPageDelete, { id: this.props.id })
        const summaryBuiltDate = summarise('Built: ', Moment(this.state.builtDate).format('LLL'))
        const recipe = React.createElement(AgentPageRecipe, { recipe: this.state.recipe, state: this.state.state })
        if (this.state.state === 'starting') {
            const message = HTML.div({ className: 'starting message' }, 'This agent is starting up...')
            const build = React.createElement(AgentPageBuild, { id: this.props.id, state: this.state.state })
            return HTML.div({ className: 'agent-page', ref: node => this.node = node }, ...[
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
            const buttons = HTML.div({ className: 'buttons' }, deleteButton)
            const message = HTML.div({ className: 'failed message' }, 'This agent failed to build.')
            const build = React.createElement(AgentPageBuild, { id: this.props.id, state: this.state.state })
            return HTML.div({ className: 'agent-page', ref: node => this.node = node }, ...[
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
            const buttons = HTML.div({ className: 'buttons' }, deleteButton, editButton, runButton)
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
            return HTML.div({ className: 'agent-page', ref: node => this.node = node }, ...[
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
