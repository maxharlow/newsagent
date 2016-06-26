import React from 'react'
import HTTP from '/HTTP.js'
import Config from '/config.js'

export default class AgentPageBuild extends React.Component {

    constructor() {
        super()
        this.state = { loading: false }
        this.load = this.load.bind(this)
    }

    componentWillMount() {
        if (this.props.state === 'starting') this.load()
    }

    componentWillUnmount() {
        if (this.state && this.state.timeout) clearTimeout(this.state.timeout)
    }

    load() {
        this.setState({ loading: true })
        const since = this.state.log ? this.state.log.length : 0
        const retry = () => setTimeout(this.load, 1 * 1000)
        const update = response => {
            const timeout = this.props.state === 'starting' ? setTimeout(this.load, 1 * 1000) : null // in seconds
            const atBottom = this.refs['build']
                  ? this.refs['build'].scrollHeight === this.refs['build'].scrollTop + this.refs['build'].clientHeight
                  : true
            this.setState({ log: this.state.log ? this.state.log.concat(response.log) : response.log, loading: false, timeout })
            if (atBottom && this.refs['build']) this.refs['build'].scrollTop = this.refs['build'].scrollHeight
        }
        HTTP.get(Config.registry + '/agents/' + this.props.id + '/build?since=' + since).then(update).catch(retry)
    }

    render() {
        if (this.state.log) {
            const entries = Object.keys(this.state.log).map(i => {
                return React.DOM.span({ className: this.state.log[i].type }, this.state.log[i].value)
            })
            const log = React.DOM.div({ className: 'log' }, React.DOM.code({ ref: 'build' }, ...entries))
            return React.DOM.div({ className: 'agent-page-build' }, React.DOM.h3({}, 'Build'), log)
        }
        else if (this.state.loading) {
            const loading = React.DOM.div({ className: 'log' }, React.DOM.div({ className: 'loading' }))
            return React.DOM.div({ className: 'agent-page-build' }, React.DOM.h3({}, 'Build'), loading)
        }
        else {
            const loadButton = React.DOM.button({ className: 'hollow', onClick: this.load }, 'Load build...')
            return React.DOM.div({ className: 'agent-page-build' }, React.DOM.h3({}, 'Build'), loadButton)
        }
    }

}
