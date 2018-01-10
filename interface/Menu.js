import React from 'react'
import HTML from 'react-dom-factories'

export default class Menu extends React.Component {

    render() {
        const title = HTML.h1({}, HTML.a({ href: '/' }, 'Newsagent'))
        return HTML.header({ className: 'menu' }, title)
    }

}
