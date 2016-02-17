import React from 'react'

export default class AgentPageDeletion extends React.Component {

    constructor() {
        super()
        this.deletion = this.deletion.bind(this)
    }
    
    deletion() {
        // todo
    }
    
    render() {
        const button = React.DOM.button({ disabled: this.props.state !== 'started', onClick: this.deletion }, 'Delete')
        return React.DOM.div({ className: 'section deletion' }, React.DOM.h3({}, 'Delete this agent'), button)
    }
    
}
