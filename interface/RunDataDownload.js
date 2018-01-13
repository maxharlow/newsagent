import React from 'react'
import HTML from 'react-dom-factories'
import Dialog from '/Dialog.js'
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
            fetch(Config.registry + '/agents/' + this.props.id + '/runs/' + this.props.run + '/' + mode, {
                headers: { 'Accept': 'text/csv' }
            })
                .then(response => response.text())
                .then(send)
                .catch(abort)
        }
    }

    changesFor(number) {
        return number === 0 ? 'no rows'
            : number === 1 ? '1 row'
            : number.toLocaleString() + ' rows'
    }

    render() {
        const changesButton = this.props.recordsChanged === null ? null : HTML.button({ onClick: this.download('data/changed'), disabled: this.props.recordsChanged === 0 }, ...[
            'Download changed rows',
            HTML.span({}, this.changesFor(this.props.recordsChanged))
        ])
        const body = [
            HTML.h5({}, Moment(this.props.date).format('LLL')),
            HTML.button({ onClick: this.download('data') }, ...[
                'Download all data',
                HTML.span({}, this.changesFor(this.props.records))
            ]),
            HTML.button({ onClick: this.download('data/added'), disabled: this.props.recordsAdded === 0 }, ...[
                'Download added rows',
                HTML.span({}, this.changesFor(this.props.recordsAdded))
            ]),
            HTML.button({ onClick: this.download('data/removed'), disabled: this.props.recordsRemoved === 0 }, ...[
                'Download removed rows',
                HTML.span({}, this.changesFor(this.props.recordsRemoved))
            ]),
            changesButton
        ]
        const dialog = React.createElement(Dialog, {
            body,
            cancel: this.props.close
        })
        return HTML.div({ className: 'run-data-download' }, dialog)
    }

}
