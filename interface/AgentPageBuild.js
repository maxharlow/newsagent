import React from 'react'
import HTML from 'react-dom-factories'
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
        fetch(Config.registry + '/agents/' + this.props.id + '/build?since=' + since)
            .then(response => response.json())
            .then(update)
            .catch(retry)
    }

    render() {
        if (this.state.log) {
            const entries = Object.keys(this.state.log).map(i => {
                return HTML.li({ className: this.state.log[i].type }, this.state.log[i].value)
            })
            const log = HTML.div({ className: 'log' }, HTML.code({ ref: 'build' }, HTML.ol({}, ...entries)))
            return HTML.div({ className: 'agent-page-build', ref: node => this.node = node }, HTML.h3({}, 'Build'), log)
        }
        else if (this.state.loading) {
            const loading = HTML.div({ className: 'log' }, HTML.div({ className: 'loading' }))
            return HTML.div({ className: 'agent-page-build', ref: node => this.node = node }, HTML.h3({}, 'Build'), loading)
        }
        else {
            const loadButton = HTML.button({ className: 'secondary', onClick: this.load }, 'Load build...')
            return HTML.div({ className: 'agent-page-build', ref: node => this.node = node }, HTML.h3({}, 'Build'), loadButton)
        }
    }

}
