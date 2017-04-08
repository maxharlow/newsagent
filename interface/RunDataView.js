import React from 'react'
import Moment from 'moment'
import ScrollTable from '/ScrollTable.js'
import HTTP from '/HTTP.js'
import Config from '/Config.js'

export default class RunDataView extends React.Component {

    constructor(props) {
        super(props)
        this.updateMode = this.updateMode.bind(this)
        this.load = this.load.bind(this)
        const checkingThreshold = 10000 // check if we really want to load data bigger than this
        this.state = {
            mode: 'data',
            data: null,
            dataChecking: props.records > checkingThreshold,
            added: null,
            addedChecking: props.recordsAdded > checkingThreshold,
            removed: null,
            removedChecking: props.recordsRemoved > checkingThreshold
        }
    }

    componentWillMount() {
        this.load()
    }

    shouldComponentUpdate(_, nextState) {
        return this.state.mode !== nextState.mode
            || this.state[this.state.mode] !== nextState[nextState.mode]
            || this.state.dataChecking !== nextState.dataChecking
            || this.state.addedChecking !== nextState.addedChecking
            || this.state.removedChecking !== nextState.removedChecking
    }

    componentDidUpdate() {
        this.load()
    }

    updateMode(event) {
        this.setState({ mode: event.target.name })
    }

    load() {
        const mode = this.state.mode // copy it, as it might change during
        if (this.state[mode]) return
        if (mode === 'data' && this.state.dataChecking) return
        if (mode === 'added' && this.state.addedChecking) return
        if (mode === 'removed' && this.state.removedChecking) return
        const locationBase = Config.registry + '/agents/' + this.props.id + '/runs/' + this.props.run + '/data'
        const location = mode === 'data' ? locationBase : locationBase + '/' + mode
        const abort = error => {
            console.error('Could not load data', error)
        }
        const update = response => {
            if (!this.node) return
            this.setState({ [mode]: response })
        }
        HTTP.get(location, []).then(update).catch(abort)
    }

    render() {
        const title = React.DOM.h2({}, Moment(this.props.date).format('LLL'))
        const modes = ['data', 'added', 'removed'].map(mode => {
            const input = React.DOM.input({ type: 'radio', name: mode, value: mode, checked: mode === this.state.mode, onChange: this.updateMode })
            const text = React.DOM.span({}, mode)
            return React.DOM.label({}, input, text)
        })
        const closeButton = React.DOM.button({ className: 'close', onClick: this.props.close }, '❮')
        const countNumber = this.state.mode === 'added' ? this.props.recordsAdded
              : this.state.mode === 'removed' ? this.props.recordsRemoved
              : this.props.records
        const countText = countNumber === 0 ? 'no rows'
              : countNumber === 1 ? '1 row'
              : countNumber.toLocaleString() + ' rows'
        const count = React.DOM.span({ className: 'count' }, countText)
        if (this.state[this.state.mode + 'Checking']) {
            const doLoad = () => this.setState({ [this.state.mode + 'Checking']: false })
            const load = React.DOM.button({ onClick: doLoad }, 'Load anyway?')
            const message = React.DOM.span({ className: 'message' }, 'This data is very large!', load)
            const data = React.DOM.div({ className: 'data' }, message)
            const box = React.DOM.div({ onClick: e => e.stopPropagation() }, closeButton, title, data, ...modes, count)
            return React.DOM.div({ className: 'run-data-view', ref: node => this.node = node, onClick: this.props.close }, box)
        }
        else if (this.state[this.state.mode] === null) {
            const loading = React.DOM.div({ className: 'loading' })
            const data = React.DOM.div({ className: 'data' }, loading)
            const box = React.DOM.div({ onClick: e => e.stopPropagation() }, closeButton, title, data, ...modes, count)
            return React.DOM.div({ className: 'run-data-view', ref: node => this.node = node, onClick: this.props.close }, box)
        }
        else if (this.state[this.state.mode].length === 0) {
            const message = React.DOM.span({ className: 'message' }, 'No data found.')
            const data = React.DOM.div({ className: 'data' }, message)
            const box = React.DOM.div({ onClick: e => e.stopPropagation() }, closeButton, title, data, ...modes, count)
            return React.DOM.div({ className: 'run-data-view', ref: node => this.node = node, onClick: this.props.close }, box)
        }
        else {
            const table = React.createElement(ScrollTable, { data: this.state[this.state.mode] })
            const data = React.DOM.div({ className: 'data' }, table)
            const box = React.DOM.div({ onClick: e => e.stopPropagation() }, closeButton, title, data, ...modes, count)
            return React.DOM.div({ className: 'run-data-view', ref: node => this.node = node, onClick: this.props.close }, box)
        }
    }

}
