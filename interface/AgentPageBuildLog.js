import React from 'react'
import HTTP from 'HTTP.js'

export default class AgentPageBuildLog extends React.Component {

    componentWillMount() {
        const registry = 'http://localhost:8000' // todo extract to config
        HTTP.get(registry + '/agents/' + this.props.id + '/build', (e, response) => {
            if (!e) this.setState(response)
        })
    }

    componentDidUpdate() {
        this.refs['buildlog'].scrollTop = this.refs['buildlog'].scrollHeight
    }

    render() {
        if (this.state) {
            const text = Object.keys(this.state).map(i => {
                if (this.state[i].text) return this.state[i].text
                else return React.DOM.span({ className: 'error' }, this.state[i].error)
            })
            const textBlock = React.DOM.code({ className: 'buildlog', ref: 'buildlog' }, text)
            return React.DOM.div({ className: 'section' }, React.DOM.h3({}, 'Build log'), textBlock)
        }
        else return React.DOM.div({ className: 'section' }, React.DOM.h3({}, 'Build log'), React.DOM.div({ className: 'loading' }, ''))
    }

}
