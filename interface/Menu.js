import React from 'react'

export default class Menu extends React.Component {

    render() {
        const titleLink = React.DOM.a({ href: '/' }, 'Datastash')
        const title = React.DOM.h1({}, titleLink)
        const links = [
            React.DOM.a({ href: '/agents' }, 'Agents'),
            React.DOM.a({ href: '/new-agent', className: 'button' }, 'Create new agent')
        ]
        const linkList = React.DOM.ul({}, ...links.map(link => React.DOM.li({}, link)))
        return React.DOM.header({}, React.DOM.nav({}, title, linkList))
    }

}
