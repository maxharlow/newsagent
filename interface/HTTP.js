export default class HTTP {

    static get(location, callback) {
        const request = new XMLHttpRequest()
        request.open('GET', location)
        request.addEventListener('load', event => {
            if (request.status < 400) callback(null, JSON.parse(request.responseText))
            else callback(new Error(request.response), null)
        })
        request.send()
    }

    static post(location, data, callback) {
        const request = new XMLHttpRequest()
        request.open('POST', location)
        request.addEventListener('load', event => {
            if (request.status < 400) callback(null)
            else callback(new Error(request.response))
        })
        request.send(JSON.stringify(data, null, 4) + '\n')
    }

}
