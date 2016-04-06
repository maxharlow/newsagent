import React from 'react'
import PrettyCron from 'prettycron'

export default class AgentPageRecipe extends React.Component {

    render() {
        const elements = [
            React.DOM.h3({}, 'Recipe'),
            React.DOM.hr({}),
            React.DOM.p({}, 'Runs at ' + PrettyCron.toString(this.props.schedule).toLowerCase() + '. Next run is ' + PrettyCron.getNext(this.props.schedule).toLowerCase() + '.'),
            React.DOM.h4({}, 'Setup'),
            this.props.setup.length > 0
                ? React.DOM.code({}, React.DOM.ol({}, ...this.props.setup.map(step => React.DOM.li({}, step))))
            : React.DOM.span({ className: 'note' }, 'This agent has no setup.'),
            React.DOM.h4({}, 'Run'),
            React.DOM.code({}, React.DOM.ol({}, ...this.props.run.map(step => React.DOM.li({}, step)))),
            React.DOM.h4({}, 'Result'),
            React.DOM.p({ className: 'field' }, this.props.result),
            React.DOM.h4({}, 'Triggers'),
            this.props.triggers.length > 0
                ? React.DOM.ul({ className: 'triggers' }, ...this.props.triggers.map(trigger => React.DOM.li({}, trigger.recipient)))
                : React.DOM.span({ className: 'note' }, 'This agent has no triggers.'),
        ]
        return React.DOM.div({ className: 'section recipe' }, ...elements)
    }

}
