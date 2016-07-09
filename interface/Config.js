import config from '/config.json'

export default {
    registry: 'http://' + (config.domain || window.location.hostname) + ':' + config.port
}
