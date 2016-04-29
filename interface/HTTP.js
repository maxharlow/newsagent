export default class HTTP {

    static request(method, location, data, callback) {
        const request = new XMLHttpRequest()
        request.open(method, location)
        request.addEventListener('load', event => {
            if (callback && request.status < 400) callback(null, request.responseText ? JSON.parse(request.responseText) : null)
            else if (callback) callback(new Error(request.response), null)
        })
        if (data) {
            request.setRequestHeader('Content-Type', 'application/json')
            request.send(JSON.stringify(data))
        }
        else request.send()
    }

    static get(location, callback) {
        this.request('GET', location, undefined, callback)
    }

    static post(location, data, callback) {
        this.request('POST', location, data, callback)
    }

    static delete(location, callback) {
        this.request('DELETE', location, undefined, callback)
    }

}
