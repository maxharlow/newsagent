import React from 'react'

export default class Dialog extends React.Component {

    render() {
        const text = React.DOM.h6({}, this.props.text)
        const cancelButton = React.DOM.button({ onClick: this.props.cancel }, 'Cancel')
        const acceptButton = React.DOM.button({ onClick: this.props.accept }, this.props.acceptText)
        const box = React.DOM.div({ onClick: e => e.stopPropagation() }, text, cancelButton, acceptButton)
        return React.DOM.div({ className: 'dialog', onClick: this.props.cancel }, box)
    }

}
