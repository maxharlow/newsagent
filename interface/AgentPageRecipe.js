import React from 'react'
import PrettyCron from 'prettycron'

export default class AgentPageRecipe extends React.Component {

    render() {
        const elements = [
            React.DOM.h3({}, 'Recipe'),
            React.DOM.hr({}),
            React.DOM.p({}, 'Runs at ' + PrettyCron.toString(this.props.schedule).toLowerCase() + '. Next run is ' + PrettyCron.getNext(this.props.schedule).toLowerCase() + '.'),
            React.DOM.h4({}, 'Location'),
            React.DOM.code({}, this.props.location),
            React.DOM.span({ className: 'note' }, this.props.updatable ? 'Updates are ON.' : 'Updates are OFF.'),
            React.DOM.h4({}, 'Setup'),
            this.props.setup.length > 0
                ? React.DOM.code({}, React.DOM.ol({}, ...this.props.setup.map(step => React.DOM.li({}, step))))
            : React.DOM.span({ className: 'note' }, 'This agent has no setup.'),
            React.DOM.h4({}, 'Run'),
            React.DOM.code({}, React.DOM.ol({}, ...this.props.run.map(step => React.DOM.li({}, step)))),
            React.DOM.h4({}, 'Result'),
            React.DOM.code({}, this.props.result),
            React.DOM.h4({}, 'Alerts'),
            this.props.alerts.length > 0
                ? React.DOM.ul({ className: 'alerts' }, ...this.props.alerts.map(alert => React.DOM.li({}, alert.recipient)))
                : React.DOM.span({ className: 'note' }, 'This agent has no alerts.'),
        ]
        return React.DOM.div({ className: 'section recipe' }, ...elements)
    }
    
}
