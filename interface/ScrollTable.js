import React from 'react'

export default class ScrollTable extends React.Component {

    constructor(props) {
        super(props)
        this.update = this.update.bind(this)
        this.state = {
            scroll: 0,
            spacersBefore: 0,
            spacersAfter: this.props.data.length - this.props.rowsAfter
        }
    }

    update(event) {
        const container = event.currentTarget.parentElement.parentElement
        const scroll = container.scrollTop < 0 ? 0 : container.scrollTop
        const spacersBeforeCalc = Math.floor(scroll / this.props.rowHeight) - this.props.rowsBefore
        const spacersBefore = spacersBeforeCalc < 0 ? 0 : spacersBeforeCalc
        const spacersAfterCalc = this.props.data.length - spacersBefore - this.props.rowsAfter
        const spacersAfter = spacersAfterCalc < 0 ? 0 : spacersAfterCalc
        this.setState({ scroll, spacersBefore, spacersAfter })
    }

    render() {
        const data = this.props.data.slice(this.state.spacersBefore, this.state.spacersBefore + this.props.rowsAfter)
        const header = React.DOM.tr({}, ...Object.keys(this.props.data[0]).map(column => React.DOM.th({}, column)))
        const rows = data.map(row => {
            const columns = Object.keys(row).map(i => React.DOM.td({}, row[i]))
            return React.DOM.tr({}, ...columns)
        })
        const head = React.DOM.thead({}, header)
        const padTop = React.DOM.div({ style: { height: this.state.spacersBefore * this.props.rowHeight } }) //// TODO ONWHEEL DOESN'T FIRE FOR THESE
        const padBottom = React.DOM.div({ style: { height: this.state.spacersAfter * this.props.rowHeight } })
        const body = React.DOM.tbody({ onWheel: this.update }, padTop, ...rows, padBottom) // onScroll exists, but doesn't seem to work
        return React.DOM.table({ className: 'scroll-table' }, head, body)
    }

}

ScrollTable.defaultProps = {
    rowHeight: 29,
    rowsBefore: 10,
    rowsAfter: 50
}
