var aws = require('aws-sdk')
var elasticsearch = require('elasticsearch')
var highland = require('highland')
var fs = require('fs')
var path = require('path')
var childProcess = require('child_process')
var gitty = require('gitty')
var moment = require('moment')
var csvParser = require('csv-parser')
var config = require('./config.json')

var clonesLocation = path.resolve('.clones')

var elasticsearchClient

function run() {
    console.log(new Date())
    console.log('Beginning sources...')
    aws.config = config.aws
    new aws.ELB().describeLoadBalancers({ LoadBalancerNames: [ 'datastash-store' ] }, function (error, data) {
	var elasticsearchHost = error ? 'localhost' : data.LoadBalancerDescriptions[0].DNSName
	var elasticsearchConfig = {
	    host: elasticsearchHost + ':' + 9200,
	    keepAlive: false
	}
	console.log('Using Elasticsearch host: ' + elasticsearchHost)
	elasticsearchClient = new elasticsearch.Client(elasticsearchConfig)
	elasticsearchClient.search({index: '.sources'}, function (error, response) {
	    if (error) throw error
	    response.hits.hits.forEach(function (hit) {
		var source = hit._source
		var identifier = source.name.replace(/ /g, '-').toLowerCase()
		retrieve(source, identifier)
	    })
	})
    })
}

function retrieve(source, identifier) {
    var location = clonesLocation + '/' + identifier
    console.log('Executing: ' + source.name)
    fs.mkdir(location, function (error) {
	if (error && error.code !== 'EEXIST' && error.code !== 'ENOENT') throw error
	gitty.clone(location, source.location, function (error) {
	    if (error && error.indexOf('already exists') < 0) throw error
	    gitty(location).pull('origin', 'master', function (error) {
		if (error) throw error
		execute(source, identifier)
	    })
	})
    })
}

function execute(source, identifier) {
    var location = clonesLocation + '/' + identifier
    console.log('Installing...')
    childProcess.exec('cd ' + location + ';' + source.install, function (error, installOut, installErrors) {
	if (error) throw error
	console.log(installOut)
	console.error(installErrors)
	console.log('Running...')
	childProcess.exec('cd ' + location + ';' + source.run, function (error, runOut, runErrors) {
	    console.log(runOut)
	    console.log(runErrors)
	    if (error) throw error
	    setup(source, identifier)
	})
    })
}

function setup(source, identifier) {
    console.log('Setting up...')
    elasticsearchClient.indices.create({index: 'data'}, function (error) {
	if (error && error.message.indexOf('already exists') === 0) throw error
	var mapping = source.mapping || {}
	mapping['@timestamp'] = { type: 'date', format: 'dateOptionalTime' }
	var mappingRequest = {
	    index: 'data',
	    type: identifier,
	    body: {
		properties: mapping
	    }
	}
	elasticsearchClient.indices.putMapping(mappingRequest, function (error) {
	    if (error) throw error
	    load(source, identifier)
	})
    })
}

function load(source, identifier) {
    console.log('Loading...')
    var location = clonesLocation + '/' + identifier
    var data = highland(fs.createReadStream(location + '/' + source.output)).through(csvParser())
    var documents = data.map(function (entry) {
	entry['@timestamp'] = moment(entry[source.timestamp], source.timestampFormat).format()
	return {
	    index: 'data',
	    type: identifier,
	    id: entry[source.key],
	    body: entry
	}
    })
    documents.ratelimit(100, 100).each(function (document) {
	elasticsearchClient.index(document, function (error, response) {
	    if (error) console.log('Could not index: ' + error.message + '\n', document)
	})
    })
}

run()
