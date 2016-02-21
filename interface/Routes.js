import React from 'react'
import ReactDOM from 'react-dom'
import Page from 'page'
import Menu from 'Menu.js'
import AgentsPage from 'AgentsPage.js'
import AgentPage from 'AgentPage.js'
import NewAgentPage from 'NewAgentPage.js'

export default class Routes {

    static run() {
        const main = document.querySelector('main')
        const menu = React.createElement(Menu, {})
        Page('/', context => {
            main.classList.remove('loading')
            ReactDOM.render(React.DOM.div({}, menu), main)
        })
        Page('/agents', context => {
            const page = React.createElement(AgentsPage, {})
            main.classList.remove('loading')
            ReactDOM.render(React.DOM.div({}, menu, page), main)
        })
        Page('/agents/:id', context => {
            const page = React.createElement(AgentPage, { id: context.params.id })
            main.classList.remove('loading')
            ReactDOM.render(React.DOM.div({}, menu, page), main)
        })
        Page('/new-agent', context => {
            const page = React.createElement(NewAgentPage, {})
            main.classList.remove('loading')
            ReactDOM.render(React.DOM.div({}, menu, page), main)
        })
        Page()
    }

}

Routes.run()
