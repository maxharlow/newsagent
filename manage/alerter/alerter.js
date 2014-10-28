var aws = require('aws-sdk')
var fs = require('fs')
var elasticsearch = require('elasticsearch')
var mustache = require('mustache')
var nodemailer = require('nodemailer')
var config = require('./config.json')

var emailTransport = nodemailer.createTransport(config.email)
var elasticsearchClient

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
    aws.config = config.aws
    new aws.ELB().describeLoadBalancers({ LoadBalancerNames: [ 'datastash-store' ] }, function (error, data) {
	var elasticsearchHost = error ? 'localhost' : data.LoadBalancerDescriptions[0].DNSName
	elasticsearchClient = new elasticsearch.Client({ host: elasticsearchHost + ':' + 9200 })
	elasticsearchClient.search({index: 'alerts-int'}, function (error, response) {
	    if (error) throw error
	    response.hits.hits.forEach(function (hit) {
		check(hit._source)
	    })
	})
    })
}

function check(alert) {
    var shadowsLocation = '.shadows'
    fs.mkdir(shadowsLocation, function (error) {
	if (error && error.code !== 'EEXIST') throw error
    })
    elasticsearchClient.search(alert.query, function (error, searchResponse) {
	if (error) throw error
	var hits = searchResponse.hits.hits.map(function (result) {
	    return result._source
	})
	var key = alert.name.replace(/ /g, '-').toLowerCase()
	fs.readFile(shadowsLocation + '/' + key, function (error, shadowsData) {
	    var shadows = error ? [] : JSON.parse(shadowsData)
	    var results = hits.filter(function (result) {
		return shadows.every(function (shadow) {
		    result == shadow
		})
	    })
	    fs.writeFile(shadowsLocation + '/' + key, JSON.stringify(results), function (error) {
		if (error) throw error
	    })
	    results.forEach(function (result) {
		var text = mustache.render(alert.message, result)
		send[alert.notification](text, alert.data)
	    })
	})
    })
}

run()
