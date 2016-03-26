import React from 'react'
import HTTP from '/HTTP.js'
import Config from '/config.js'

export default class AgentPageBuildLog extends React.Component {

    constructor() {
        super()
        this.state = { loading: false }
        this.load = this.load.bind(this)
    }

    load() {
        this.setState({ loading: true })
        HTTP.get(Config.registry + '/agents/' + this.props.id + '/build', (e, response) => {
            if (!e) this.setState({ log: response, loading: false })
        })
    }

    componentDidUpdate() {
        if (this.refs['buildlog']) this.refs['buildlog'].scrollTop = this.refs['buildlog'].scrollHeight
    }

    render() {
        if (this.state.log) {
            const text = Object.keys(this.state.log).map(i => {
                if (this.state.log[i].text) return this.state.log[i].text
                else return React.DOM.span({ className: 'error-message' }, this.state.log[i].error)
            })
            const textBlock = React.DOM.code({ ref: 'buildlog' }, ...text)
            return React.DOM.div({ className: 'section buildlog' }, React.DOM.h3({}, 'Build log'), textBlock)
        }
        else if (this.state.loading) {
            const loading = React.DOM.div({ className: 'loading' })
            return React.DOM.div({ className: 'section buildlog' }, React.DOM.h3({}, 'Build log'), loading)
        }
        else {
            const loadButton = React.DOM.button({ className: 'minor', onClick: this.load }, 'Load build log...')
            return React.DOM.div({ className: 'section buildlog' }, React.DOM.h3({}, 'Build log'), loadButton)
        }
    }

}
