import React from 'react'

export default class Dialog extends React.Component {

    constructor() {
        super()
        this.state = { loading: false }
        this.proceed = this.proceed.bind(this)
    }

    proceed() {
        this.setState({ loading: true })
        this.props.accept()
    }

    render() {
        if (this.state.loading) {
            const box = React.DOM.div({ onClick: e => e.stopPropagation() }, React.DOM.div({ className: 'loading' }))
            return React.DOM.div({ className: 'dialog' }, box)
        }
        else {
            const text = React.DOM.h6({}, this.props.text)
            const cancelButton = React.DOM.button({ onClick: this.props.cancel }, 'Cancel')
            const acceptButton = React.DOM.button({ onClick: this.proceed }, this.props.acceptText)
            const box = React.DOM.div({ onClick: e => e.stopPropagation() }, text, cancelButton, acceptButton)
            return React.DOM.div({ className: 'dialog', onClick: this.props.cancel }, box)
        }
    }

}
