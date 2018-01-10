import React from 'react'
import HTML from 'react-dom-factories'
import ReactDOM from 'react-dom'
import Page from 'page'
import Menu from '/Menu.js'
import DashboardPage from '/DashboardPage.js'
import AgentPage from '/AgentPage.js'
import RunPage from '/RunPage.js'
import NewAgentPage from '/NewAgentPage.js'

export default class Routes {

    static run() {
        const main = document.querySelector('main')
        const menu = React.createElement(Menu, {})
        Page('/', context => {
            const page = React.createElement(DashboardPage, {})
            main.classList.remove('loading')
            ReactDOM.render(HTML.div({}, menu, page), main)
            window.scrollTo(0, 0)
        })
        Page('/agents/:agent', context => {
            const page = React.createElement(AgentPage, { id: context.params.agent })
            main.classList.remove('loading')
            ReactDOM.render(HTML.div({}, menu, page), main)
            window.scrollTo(0, 0)
        })
        Page('/agents/:agent/runs/:run', context => {
            const page = React.createElement(RunPage, { agent: context.params.agent, run: context.params.run })
            main.classList.remove('loading')
            ReactDOM.render(HTML.div({}, menu, page), main)
            window.scrollTo(0, 0)
        })
        Page('/new-agent', context => {
            const page = React.createElement(NewAgentPage, {})
            main.classList.remove('loading')
            ReactDOM.render(HTML.div({}, menu, page), main)
            window.scrollTo(0, 0)
        })
        Page('*', context => {
            main.classList.remove('loading')
            ReactDOM.render(HTML.div({}, menu, 'Not found'), main)
            window.scrollTo(0, 0)
        })
        Page()
    }

}

Routes.run()
