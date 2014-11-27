var aws = require('aws-sdk')
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
    console.log(new Date())
    console.log('Beginning alerts...')
    aws.config = config.aws
    new aws.ELB().describeLoadBalancers({ LoadBalancerNames: [ 'datastash-store' ] }, function (error, data) {
	var elasticsearchHost = error ? 'localhost' : data.LoadBalancerDescriptions[0].DNSName
	var elasticsearchConfig = {
	    host: elasticsearchHost + ':' + 9200,
	    keepAlive: false
	}
	console.log('Using Elasticsearch host: ' + elasticsearchHost)
	elasticsearchClient = new elasticsearch.Client(elasticsearchConfig)
	elasticsearchClient.search({index: '.alerts', type: 'alert'}, function (error, response) {
	    if (error) throw error
	    response.hits.hits.forEach(function (hit) {
		check(hit._source, hit._id)
	    })
	})
    })
}

function check(alert, identifier) {
    var query = alert.query
    query.size = 100
    elasticsearchClient.search(query, function (error, queryResponse) {
	if (error) throw error
	var queryMatches = queryResponse.hits.hits.map(function (hit) {
	    return hit._source
	})
	elasticsearchClient.search({index: '.alerts', type: 'shadow', id: identifier}, function (error, shadowResponse) {
	    if (error) throw error
	    var shadowMatches = shadowResponse.hits.hits.map(function (hit) {
		return hit._source
	    })
	    var results = queryMatches.filter(function (queryResult) {
		return shadowMatches.indexOf(queryResult) !== 0
	    })
	    var document = {
		index: '.alerts',
		type: 'shadow',
		id: identifier,
		body: { results: results }
	    }
	    elasticsearchClient.index(document, function (error) {
		if (error) throw error
	    })
	    var text = results.reduce(function (previous, result) {
		return previous + '\n\n' + mustache.render(alert.message, result)
	    }, '')
	    if (shadowMatches.length > 0 && text != '') send[alert.notification](text, alert.data)
	})
    })
}

run()
