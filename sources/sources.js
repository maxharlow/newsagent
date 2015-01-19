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
    console.log('-- ' + new Date() + ' --')
    withStore(function () {
	elasticsearchClient.search({index: '.sources', type: 'source'}, function (error, response) {
	    if (error) throw error
	    response.hits.hits.forEach(function (hit) {
		var source = hit._source
		var identifier = source.name.replace(/ /g, '-').toLowerCase()
		retrieve(source, identifier)
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
	    keepAlive: false
	}
	console.log('\nUsing Elasticsearch host: ' + elasticsearchHost + '\n')
	elasticsearchClient = new elasticsearch.Client(elasticsearchConfig)
	callback()
    })
}

function retrieve(source, identifier) {
    var location = clonesLocation + '/' + identifier
    console.log('Retrieving: ' + source.name)
    fs.mkdir(location, function (error) {
	if (error && error.code !== 'EEXIST' && error.code !== 'ENOENT') throw error
	gitty.clone(location, source.location, function (error) {
	    if (error && error.indexOf('already exists') < 0) throw error
	    gitty(location).pull('origin', 'master', function (error) { // todo: will fail if data file has been updated at origin, and is different locally (stash & drop?)
		if (error) throw error
		var revision = gitty(location).describeSync().replace('\n', '')
		execute(source, identifier, revision)
	    })
	})
    })
}

function execute(source, identifier, revision) {
    var detail = {
	source: source.name,
	date: new Date().toISOString(),
	revision: revision
    }
    var location = clonesLocation + '/' + identifier
    console.log('Installing...')
    childProcess.exec('cd ' + location + ';' + source.install, function (error, installOut, installErrors) {
	if (error) throw error
	detail.installOut = installOut
	detail.installErrors = installErrors
	console.log('Running...')
	childProcess.exec('cd ' + location + ';' + source.run, function (error, runOut, runErrors) {
	    if (error) throw error
	    detail.runOut = runOut
	    detail.runErrors = runErrors
	    var logs = {
		index: '.sources',
		type: 'logs',
		body: detail
	    }
	    elasticsearchClient.index(logs, function (error, response) {
		if (error) throw error
	    })
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
