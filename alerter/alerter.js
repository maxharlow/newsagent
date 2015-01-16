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
    console.log('-- ' + new Date() + ' --')
    withStore(function () {
	elasticsearchClient.search({index: '.alerts', type: 'alert'}, function (error, response) {
	    if (error) throw error
	    response.hits.hits.forEach(function (hit) {
		retrieve(hit._source, hit._id)
	    })
	})
    })
}

function withStore(callback) {
    aws.config = config.aws
    new aws.ELB().describeLoadBalancers({ LoadBalancerNames: [ 'datastash-store' ] }, function (error, data) {
	var elasticsearchHost = error ? 'localhost' : data.LoadBalancerDescriptions[0].DNSName
	var elasticsearchConfig = {
	    host: elasticsearchHost + ':' + 9200,
	    keepAlive: true
	}
	console.log('\nUsing Elasticsearch host: ' + elasticsearchHost + '\n')
	elasticsearchClient = new elasticsearch.Client(elasticsearchConfig)
	callback()
    })
}

function retrieve(alert, identifier, matches, scrollId) {
    matches = matches || []
    function loop(error, queryResponse) {
	if (error) throw error
	var queryMatches = queryResponse.hits.hits.map(function (hit) {
	    return hit._source
	})
	var updatedMatches = matches.concat(queryMatches)
	if (queryResponse.hits.total !== updatedMatches.length) retrieve(alert, identifier, updatedMatches, queryResponse._scroll_id)
	else compare(alert, identifier, updatedMatches)
    }
    if (scrollId === undefined) {
	var query = alert.query
	query.searchType = 'scan'
	query.scroll = '10m'
	elasticsearchClient.search(query, loop)
    }
    else {
	var query = {
	    scrollId: scrollId,
	    scroll: '10m'
	}
	elasticsearchClient.scroll(query, loop)
    }
}

function compare(alert, identifier, queryMatches) {
    var shadowQuery = {
	searchType: 'scan',
	scroll: '10m',
	index: '.alerts',
	type: 'shadow',
	id: identifier
    }
    elasticsearchClient.search(shadowQuery, function (error, shadowResponse) {
	if (error) throw error
	var hasShadow = shadowResponse.hits.hits.length > 0
	var shadowMatches = hasShadow ? shadowResponse.hits.hits[0]._source.results : [] // entire shadow is one hit
	var results = queryMatches.filter(function (queryMatch) {
	    return shadowMatches.reduce(function (a, shadowMatch) {
		return a && JSON.stringify(queryMatch) !== JSON.stringify(shadowMatch)
	    }, true)
	})
	check(alert, identifier, results, hasShadow)
    })
}

function check(alert, identifier, results, hasShadow) {
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
    if (hasShadow && text != '') send[alert.notification](text, alert.data)
}

run()
