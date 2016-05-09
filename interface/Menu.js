import React from 'react'

export default class Menu extends React.Component {

    render() {
        const title = React.DOM.h1({}, React.DOM.a({ href: '/' }, 'Datastash'))
        return React.DOM.header({ className: 'menu' }, title)
    }

}
