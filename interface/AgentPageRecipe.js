import React from 'react'
import PrettyCron from 'prettycron'

export default class AgentPageRecipe extends React.Component {

    render() {
        const elements = [
            React.DOM.p({}, 'Runs at ' + PrettyCron.toString(this.props.recipe.schedule).toLowerCase() + (this.props.state === 'started' ? '. Next run is ' + PrettyCron.getNext(this.props.recipe.schedule).toLowerCase() : '') + '.'),
            React.DOM.h4({}, 'Setup commands'),
            this.props.recipe.setup.length > 0
                ? React.DOM.code({}, React.DOM.ol({}, ...this.props.recipe.setup.map(step => React.DOM.li({}, step))))
            : React.DOM.span({ className: 'note' }, 'This agent has no setup.'),
            React.DOM.h4({}, 'Run commands'),
            React.DOM.code({}, React.DOM.ol({}, ...this.props.recipe.run.map(step => React.DOM.li({}, step)))),
            React.DOM.h4({}, 'Result file'),
            React.DOM.span({ className: 'field' }, this.props.recipe.result),
            React.DOM.h4({}, 'Triggers'),
            this.props.recipe.triggers.length > 0
                ? React.DOM.ul({ className: 'triggers' }, ...this.props.recipe.triggers.map(trigger => React.DOM.li({}, trigger.recipient)))
                : React.DOM.span({ className: 'note' }, 'This agent has no triggers.'),
        ]
        return React.DOM.div({ className: 'agent-page-recipe' }, ...elements)
    }

}
