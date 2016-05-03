export default class HTTP {

    static request(method, location, data) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest()
            request.open(method, location)
            request.addEventListener('load', event => {
                if (request.status < 400) resolve(request.responseText ? JSON.parse(request.responseText) : null)
                else reject(new Error(request.response))
            })
            if (data) {
                request.setRequestHeader('Content-Type', 'application/json')
                request.send(JSON.stringify(data))
            }
            else request.send()
        })
    }

    static get(location) {
        return this.request('GET', location, undefined)
    }

    static post(location, data) {
        return this.request('POST', location, data)
    }

    static delete(location) {
        return this.request('DELETE', location, undefined)
    }

}
