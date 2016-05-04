import React from 'react'
import HTTP from '/HTTP.js'
import Config from '/config.js'

export default class AgentPageBuildLog extends React.Component {

    constructor() {
        super()
        this.state = { loading: false }
        this.load = this.load.bind(this)
    }

    componentWillMount() {
        if (this.props.state === 'starting') this.load()
    }

    componentWillUnmount() {
        if (this.state.timeout) clearTimeout(this.state.timeout)
    }

    load() {
        this.setState({ loading: true })
        const since = this.state.log ? this.state.log.length : 0
        HTTP.get(Config.registry + '/agents/' + this.props.id + '/build?since=' + since).then(response => {
            const timeout = this.props.state === 'starting' ? setTimeout(this.load, 1 * 1000) : null // in seconds
            const atBottom = this.refs['buildlog']
                  ? this.refs['buildlog'].scrollHeight === this.refs['buildlog'].scrollTop + this.refs['buildlog'].clientHeight
                  : true
            this.setState({ log: this.state.log ? this.state.log.concat(response.log) : response.log, loading: false, timeout })
            if (atBottom && this.refs['buildlog']) this.refs['buildlog'].scrollTop = this.refs['buildlog'].scrollHeight
        })
    }

    render() {
        if (this.state.log) {
            const text = Object.keys(this.state.log).map(i => {
                return React.DOM.span({ className: this.state.log[i].type }, this.state.log[i].value)
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
