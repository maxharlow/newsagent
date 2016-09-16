import React from 'react'

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
        const container = this.table.parentElement
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

    componentWillUnmount() {
        clearTimeout(this.state.timeout)
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.props !== nextProps || this.state.scroll !== nextState.scroll
    }

    render() {
        const data = this.props.data.slice(this.state.spacesAbove, this.state.spacesAbove + this.props.rowsBelow)
        const header = React.DOM.tr({}, ...Object.keys(this.props.data[0]).map(column => React.DOM.th({}, column)))
        const setHeight = row => this.rowHeight = row ? row.getBoundingClientRect().height : this.rowHeight
        const rows = data.map((row, i) => {
            const columns = Object.keys(row).map(i => React.DOM.td({}, row[i]))
            return React.DOM.tr(i === 0 ? { ref: setHeight } : {}, ...columns)
        })
        const head = React.DOM.thead({}, header)
        const spacer = React.DOM.td({ colSpan: Object.keys(data[0]).length, style: { padding: 0, border: 'none' } })
        const spaceAbove = React.DOM.tr({ style: { height: this.state.spacesAbove * this.state.rowHeight } }, spacer)
        const spaceBelow = React.DOM.tr({ style: { height: this.state.spacesBelow * this.state.rowHeight } }, spacer)
        const body = React.DOM.tbody({}, spaceAbove, ...rows, spaceBelow)
        return React.DOM.table({ className: 'scroll-table', ref: table => this.table = table }, head, body)
    }

}

ScrollTable.defaultProps = {
    rowsAbove: 100,
    rowsBelow: 200
}
