import React from 'react'
import HTTP from '/HTTP.js'
import Config from '/Config.js'

export default class AgentPageBuild extends React.Component {

    constructor() {
        super()
        this.state = {
            loading: false
        }
        this.load = this.load.bind(this)
    }

    componentWillMount() {
        if (this.props.state !== 'started') this.load()
    }

    componentWillUnmount() {
        if (this.state && this.state.timeout) clearTimeout(this.state.timeout)
    }

    load() {
        this.setState({ loading: true })
        const since = this.state.log ? this.state.log.length : 0
        const retry = () => {
            if (!this.node) return
            const timeout = setTimeout(this.load, 1 * 1000)
            this.setState({ timeout })
        }
        const update = response => {
            if (!this.node) return
            const timeout = this.props.state === 'starting' ? setTimeout(this.load, 1 * 1000) : null // in milliseconds
            const shouldScroll = this.refs['build']
                  ? this.refs['build'].scrollHeight === this.refs['build'].scrollTop + this.refs['build'].clientHeight
                  : true
            this.setState({
                log: this.state.log ? this.state.log.concat(response.log) : response.log,
                loading: false,
                timeout
            })
            if (shouldScroll && this.refs['build']) this.refs['build'].scrollTop = this.refs['build'].scrollHeight
        }
        HTTP.get(Config.registry + '/agents/' + this.props.id + '/build?since=' + since).then(update).catch(retry)
    }

    render() {
        if (this.state.log) {
            const entries = Object.keys(this.state.log).map(i => {
                return React.DOM.li({ className: this.state.log[i].type }, this.state.log[i].value)
            })
            const log = React.DOM.div({ className: 'log' }, React.DOM.code({ ref: 'build' }, React.DOM.ol({}, ...entries)))
            return React.DOM.div({ className: 'agent-page-build', ref: node => this.node = node }, React.DOM.h3({}, 'Build'), log)
        }
        else if (this.state.loading) {
            const loading = React.DOM.div({ className: 'log' }, React.DOM.div({ className: 'loading' }))
            return React.DOM.div({ className: 'agent-page-build', ref: node => this.node = node }, React.DOM.h3({}, 'Build'), loading)
        }
        else {
            const loadButton = React.DOM.button({ className: 'secondary', onClick: this.load }, 'Load build...')
            return React.DOM.div({ className: 'agent-page-build', ref: node => this.node = node }, React.DOM.h3({}, 'Build'), loadButton)
        }
    }

}
