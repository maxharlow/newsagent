import React from 'react'
import Moment from 'moment'
import HTTP from '/HTTP.js'
import Config from '/Config.js'

export default class RunDataView extends React.Component {

    constructor() {
        super()
        this.updateMode = this.updateMode.bind(this)
        this.load = this.load.bind(this)
        this.download = this.download.bind(this)
        this.state = {
            mode: 'data',
            data: null,
            added: null,
            removed: null
        }
    }

    updateMode(event) {
        this.setState({ mode: event.target.name })
    }

    load() {
        const mode = this.state.mode // copy it, as it might change during
        if (this.state[mode]) return
        const locationBase = Config.registry + '/agents/' + this.props.id + '/runs/' + this.props.run
        const location = mode === 'data' ? locationBase : locationBase + '/' + mode
        HTTP.get(location, []).then(response => {
           this.setState({ [mode]: response })
        })
    }

    download() {
        HTTP.get(Config.registry + '/agents/' + this.props.id + '/runs/' + this.props.run, [{ 'Accept': 'text/csv' }]).then(response => {
            const blob = new Blob([response], { type: 'data:text/csv;charset=utf-8,' })
            const anchor = document.createElement('a')
            anchor.setAttribute('href', URL.createObjectURL(blob))
            anchor.setAttribute('download', `${this.props.id}-${this.props.run}.csv`)
            document.body.appendChild(anchor)
            anchor.click()
        })
    }

    componentWillUpdate() {
        this.load()
    }

    render() {
        const title = React.DOM.h3({}, Moment(this.props.run).format('LLL'))
        const modes = ['data', 'added', 'removed'].map(mode => {
            const input = React.DOM.input({ type: 'radio', name: mode, value: mode, checked: mode === this.state.mode, onChange: this.updateMode })
            const text = React.DOM.span({}, mode)
            return React.DOM.label({}, input, text)
        })
        const closeButton = React.DOM.button({ className: 'close', onClick: this.props.close }, 'Close')
        if (this.state[this.state.mode] === null) {
            const loading = React.DOM.div({ className: 'loading' })
            const data = React.DOM.div({ className: 'data' }, loading)
            const box = React.DOM.div({ onClick: e => e.stopPropagation() }, closeButton, title, data, modes)
            return React.DOM.div({ className: 'run-data-view', onClick: this.props.close }, box)
        }
        else if (this.state[this.state.mode].length === 0) {
            const message = React.DOM.span({ className: 'no-data' }, 'No data found.')
            const data = React.DOM.div({ className: 'data' }, message)
            const box = React.DOM.div({ onClick: e => e.stopPropagation() }, closeButton, title, data, modes)
            return React.DOM.div({ className: 'run-data-view', onClick: this.props.close }, box)
        }
        else {
            const tableHeader = React.DOM.tr({}, ...Object.keys(this.state[this.state.mode][0]).map(column => React.DOM.th({}, column)))
            const tableRows = this.state[this.state.mode].map(row => {
                const columns = Object.keys(row).map(i => React.DOM.td({}, row[i]))
                return React.DOM.tr({}, ...columns)
            })
            const table = React.DOM.table({}, React.DOM.thead({}, tableHeader), React.DOM.tbody({}, ...tableRows))
            const data = React.DOM.div({ className: 'data' }, table)
            const count = React.DOM.span({ className: 'count' }, this.state[this.state.mode].length.toLocaleString() + ' rows')
            const downloadButton = React.DOM.button({ className: 'download', onClick: this.download }, 'Download')
            const box = React.DOM.div({ onClick: e => e.stopPropagation() }, closeButton, downloadButton, title, data, modes, count)
            return React.DOM.div({ className: 'run-data-view', onClick: this.props.close }, box)
        }
    }

}
