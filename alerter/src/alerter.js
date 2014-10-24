var fs = require('fs')
var elasticsearch = require('elasticsearch')
var mustache = require('mustache')
var nodemailer = require('nodemailer')
var config = require('../config.json')

var elasticsearchClient = new elasticsearch.Client({ host: 'localhost:9200' })
var emailTransport = nodemailer.createTransport(config.email)

var send = {
    'log': console.log,
    'email': function (message, data) {
	var data = {
	    from: 'datastash@example.com',
	    to: data.recipient,
	    subject: 'Datastash alert',
	    text: message
	}
	emailTransport.sendMail(data, function (error, info) {
	    if (error) throw error
	    console.log('Email sent: ' + info.response)
	})
    }
}

function run() {
    var alertsLocation = '../alerts'
    fs.readdir(alertsLocation, function (error, filenames) {
	if (error) throw error
	filenames.forEach(function (filename) {
	    fs.readFile(alertsLocation + '/' + filename, function (error, data) {
		if (error) throw error
		var alert = JSON.parse(data)
		check(alert)
	    })
	})
    })
}

function check(alert) {
    var shadowsLocation = '../.shadows'
    fs.mkdir(shadowsLocation, function (error) {
	if (error && error.code !== 'EEXIST') throw error
    })
    elasticsearchClient.search(alert.query, function (searchError, searchResponse) {
	if (searchError) throw searchError
	var hits = searchResponse.hits.hits.map(function (result) {
	    return result._source
	})
	var key = alert.name.replace(/ /g, '-').toLowerCase()
	fs.readFile(shadowsLocation + '/' + key, function (shadowsError, shadowsData) {
	    var shadows = shadowsError ? [] : JSON.parse(shadowsData)
	    var results = hits.filter(function (result) {
		return shadows.every(function (shadow) {
		    result == shadow
		})
	    })
	    fs.writeFile(shadowsLocation + '/' + key, JSON.stringify(results), function (shadowfileError) {
		if (shadowfileError) throw shadowfileError
	    })
	    results.forEach(function (result) {
		var text = mustache.render(alert.message, result)
		send[alert.notification](text, alert.data)
	    })
	})
    })
}

run()
