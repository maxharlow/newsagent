import React from 'react'
import HTML from 'react-dom-factories'

export default class Dialog extends React.Component {

    constructor() {
        super()
        this.state = { loading: false }
        this.proceed = this.proceed.bind(this)
    }

    proceed() {
        if (this.props.validate && this.props.validate() === false) return
        this.setState({ loading: true })
        this.props.accept()
    }

    render() {
        if (this.state.loading) {
            const box = HTML.div({ onClick: e => e.stopPropagation() }, HTML.div({ className: 'loading' }))
            return HTML.div({ className: 'dialog' }, box)
        }
        else {
            const cancelButton = HTML.button({ className: 'modal', onClick: this.props.cancel }, 'Cancel')
            const acceptButton = !this.props.acceptText
                  ? null
                  : HTML.button({ className: 'modal', onClick: this.proceed }, this.props.acceptText)
            const box = HTML.div({ onClick: e => e.stopPropagation() }, ...this.props.body, cancelButton, acceptButton)
            return HTML.div({ className: 'dialog', onClick: this.props.cancel }, box)
        }
    }

}
