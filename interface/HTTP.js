export default class HTTP {

    static request(method, location, headers, data) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest()
            request.open(method, location)
            request.addEventListener('load', event => {
                if (request.status < 400) {
                    try { resolve(JSON.parse(request.responseText)) }
                    catch (e) { resolve(request.responseText) }
                }
                else reject(JSON.parse(request.responseText))
            })
            if (headers) headers.forEach(header => {
                const key = Object.keys(header)[0]
                request.setRequestHeader(key, header[key])
            })
            if (data) {
                request.setRequestHeader('Content-Type', 'application/json')
                request.send(JSON.stringify(data))
            }
            else request.send()
        })
    }

    static get(location, headers) {
        return this.request('GET', location, headers)
    }

    static post(location, headers, data) {
        return this.request('POST', location, headers, data)
    }

    static patch(location, headers, data) {
        return this.request('PATCH', location, headers, data)
    }

    static delete(location, headers) {
        return this.request('DELETE', location, headers)
    }

}
