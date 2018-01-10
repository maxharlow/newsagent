import React from 'react'
import HTML from 'react-dom-factories'

export default class ScrollTable extends React.Component {

    constructor(props) {
        super(props)
        this.update = this.update.bind(this)
        this.state = {
            scroll: 0,
            spacesAbove: 0,
            spacesBelow: this.props.data.length - this.props.rowsBelow,
            rowHeight: 0
        }
    }

    update() {
        if (!this.node) return
        const container = this.node.parentElement
        const scroll = container.scrollTop < 0 ? 0 : container.scrollTop
        const spacesAboveCalc = Math.floor(scroll / this.state.rowHeight) - this.props.rowsAbove
        const spacesAbove = spacesAboveCalc < 0 ? 0 : spacesAboveCalc
        const spacesBelowCalc = this.props.data.length - spacesAbove - this.props.rowsBelow
        const spacesBelow = spacesBelowCalc < 0 ? 0 : spacesBelowCalc
        const timeout = setTimeout(this.update, 250) // in milliseconds -- workaround scroll event not firing inside tables
        this.setState({ scroll, spacesAbove, spacesBelow, timeout })
    }

    componentDidMount() {
        this.setState({ rowHeight: this.rowHeight })
        this.update()
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.props !== nextProps || this.state.scroll !== nextState.scroll
    }

    render() {
        const data = this.props.data.slice(this.state.spacesAbove, this.state.spacesAbove + this.props.rowsBelow)
        const header = HTML.tr({}, ...Object.keys(this.props.data[0]).map(column => HTML.th({}, column)))
        const setHeight = row => this.rowHeight = row ? row.getBoundingClientRect().height : this.rowHeight
        const rows = data.map((row, i) => {
            const columns = Object.keys(row).map(i => HTML.td({}, row[i]))
            return HTML.tr(i === 0 ? { ref: setHeight } : {}, ...columns)
        })
        const head = HTML.thead({}, header)
        const spacer = HTML.td({ colSpan: Object.keys(data[0]).length, style: { padding: 0, border: 'none' } })
        const spaceAbove = HTML.tr({ style: { height: this.state.spacesAbove * this.state.rowHeight } }, spacer)
        const spaceBelow = HTML.tr({ style: { height: this.state.spacesBelow * this.state.rowHeight } }, spacer)
        const body = HTML.tbody({}, spaceAbove, ...rows, spaceBelow)
        return HTML.table({ className: 'scroll-table', ref: node => this.node = node }, head, body)
    }

}

ScrollTable.defaultProps = {
    rowsAbove: 100,
    rowsBelow: 200
}
