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
            const text = React.DOM.code({ className: 'buildlog', ref: 'buildlog' }, Object.keys(this.state).map(i => this.state[i].stream))
            return React.DOM.div({ className: 'section' }, React.DOM.h3({}, 'Build log'), text)
        }
        else return React.DOM.div({ className: 'section' }, React.DOM.h3({}, 'Build log'), React.DOM.div({ className: 'loading' }, ''))
    }

}
