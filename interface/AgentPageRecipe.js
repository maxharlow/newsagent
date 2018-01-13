import React from 'react'
import HTML from 'react-dom-factories'
import PrettyCron from 'prettycron'

export default class AgentPageRecipe extends React.Component {

    render() {
        const schedule = 'Runs ' + PrettyCron.toString(this.props.recipe.schedule).toLowerCase() + '.'
        const next = this.props.state === 'started'
              ? ' Next run is ' + PrettyCron.getNext(this.props.recipe.schedule).toLowerCase() + '.'
              : ''
        const elements = [
            HTML.p({}, this.props.recipe.schedule === '' ? 'Not scheduled to run.' : schedule + next),
            HTML.h4({}, 'Setup commands'),
            this.props.recipe.setup.length > 0
                ? HTML.code({}, HTML.ol({}, ...this.props.recipe.setup.map(step => HTML.li({ className: 'stdin' }, step))))
                : HTML.span({ className: 'note' }, 'This agent has no setup.'),
            HTML.h4({}, 'Run commands'),
            HTML.code({}, HTML.ol({}, ...this.props.recipe.run.map(step => HTML.li({ className: 'stdin' }, step)))),
            HTML.h4({}, 'Result file'),
            HTML.span({ className: 'field filename' }, this.props.recipe.result),
            HTML.h4({}, 'ID field'),
            this.props.recipe.key
                ? HTML.span({ className: 'field' }, this.props.recipe.key)
                : HTML.span({ className: 'note' }, 'This agent has no ID field defined.'),
            HTML.h4({}, 'Triggers'),
            this.props.recipe.triggers.length > 0
                ? HTML.ul({ className: 'triggers' }, ...this.props.recipe.triggers.map(trigger => HTML.li({}, trigger.recipient)))
                : HTML.span({ className: 'note' }, 'This agent has no triggers.'),
        ]
        return HTML.div({ className: 'agent-page-recipe' }, ...elements)
    }

}
