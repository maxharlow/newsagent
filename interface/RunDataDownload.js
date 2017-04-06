import React from 'react'
import Dialog from '/Dialog.js'
import HTTP from '/HTTP.js'
import Moment from 'moment'
import Config from '/Config.js'

export default class RunDataDownload extends React.Component {

    constructor() {
        super()
        this.download = this.download.bind(this)
    }

    download(mode) {
        return () => {
            const abort = error => {
                console.error('Could not download ' + mode, error)
            }
            const send = response => {
                const blob = new Blob([response], { mode: 'data:text/csv;charset=utf-8,' })
                const anchor = document.createElement('a')
                anchor.setAttribute('href', URL.createObjectURL(blob))
                anchor.setAttribute('download', `${this.props.id}-${mode}-${this.props.run}.csv`)
                document.body.appendChild(anchor)
                anchor.click()
            }
            HTTP.get(Config.registry + '/agents/' + this.props.id + '/runs/' + this.props.run + '/' + mode, [{ 'Accept': 'text/csv' }]).then(send).catch(abort)
        }
    }

    changesFor(number) {
        return number === 0 ? 'no rows'
            : number === 1 ? '1 row'
            : number.toLocaleString() + ' rows'
    }

    render() {
        const body = [
            React.DOM.h5({}, Moment(this.props.date).format('LLL')),
            React.DOM.button({ onClick: this.download('data') }, ...[
                'Download all data',
                React.DOM.span({}, this.changesFor(this.props.records))
            ]),
            React.DOM.button({ onClick: this.download('data/added'), disabled: this.props.recordsAdded === 0 }, ...[
                'Download added rows',
                React.DOM.span({}, this.changesFor(this.props.recordsAdded))
            ]),
            React.DOM.button({ onClick: this.download('data/removed'), disabled: this.props.recordsRemoved === 0 }, ...[
                'Download removed rows',
                React.DOM.span({}, this.changesFor(this.props.recordsRemoved))
            ])
        ]
        const dialog = React.createElement(Dialog, {
            body,
            cancel: this.props.close
        })
        return React.DOM.div({ className: 'run-data-download' }, dialog)
    }

}
