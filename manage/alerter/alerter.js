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
    aws.config = config.aws
    new aws.ELB().describeLoadBalancers({ LoadBalancerNames: [ 'datastash-store' ] }, function (error, data) {
	var elasticsearchHost = error ? 'localhost' : data.LoadBalancerDescriptions[0].DNSName
	elasticsearchClient = new elasticsearch.Client({ host: elasticsearchHost + ':' + 9200 })
	elasticsearchClient.search({index: 'alerts-int', type: 'alert'}, function (error, response) {
	    if (error) throw error
	    response.hits.hits.forEach(function (hit) {
		check(hit._source, hit._id)
	    })
	    elasticsearchClient.close()
	})
    })
}

function check(alert, identifier) {
    var query = alert.query
    query.size = 100
    elasticsearchClient.search(query, function (error, queryResponse) {
	if (error) throw error
	var matches = queryResponse.hits.hits.map(function (hit) {
	    return hit._source
	})
	elasticsearchClient.search({index: 'alerts-int', type: 'shadow', id: identifier}, function (error, shadowResponse) {
	    if (error) throw error
	    var hasShadow = shadowResponse.hits.hits.length.length > 0
	    var shadow = hasShadow ? shadowResponse.hits.hits[0]._source.results : []
	    var results = matches.filter(function (result) {
		return shadow.every(function (shadowResult) {
		    result == shadowResult
		})
	    })
	    var document = {
		index: 'alerts-int',
		type: 'shadow',
		id: identifier,
		body: { results: results }
	    }
	    elasticsearchClient.index(document, function (error) {
		if (error) throw error
	    })
	    var text = results.reduce(function (previous, result) {
		return previous + '\n' + mustache.render(alert.message, result)
	    }, '')
	    if (hasShadow && text != '') send[alert.notification](text, alert.data)
	})
    })
}

run()
