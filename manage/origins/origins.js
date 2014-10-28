var aws = require('aws-sdk')
var elasticsearch = require('elasticsearch')
var highland = require('highland')
var fs = require('fs')
var path = require('path')
var childProcess = require('child_process')
var gitty = require('gitty')
var csvParser = require('csv-parser')
var config = require('./config.json')

var clonesLocation = path.resolve('.clones')

var elasticsearchClient

function run() {
    aws.config = config.aws
    new aws.ELB().describeLoadBalancers({ LoadBalancerNames: [ 'datastash-store' ] }, function (error, data) {
	var elasticsearchHost = error ? 'localhost' : data.LoadBalancerDescriptions[0].DNSName
	console.log('Using Elasticsearch host: ' + elasticsearchHost)
	elasticsearchClient = new elasticsearch.Client({ host: elasticsearchHost + ':' + 9200 })
	elasticsearchClient.search({index: 'sources-int'}, function (error, response) {
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
	    if (error) throw error
	    console.log(runOut)
	    console.error(runErrors)
	    load(source, identifier)
	})
    })
}

function load(source, identifier) {
    console.log('Loading...')
    var location = clonesLocation + '/' + identifier
    var datafile = highland(fs.createReadStream(location + '/' + source.output)).through(csvParser())
    var data = datafile.map(function (entry) {
	entry['@timestamp'] = entry[source.timestampedBy]
	delete entry[source.timestampedBy]
	for (var property in entry) {
	    entry[property] = Number(entry[property]) || entry[property]
	}
	return entry
    })
    data.each(function (entry) {
	var document = {
	    index: 'data',
	    type: identifier,
	    id: entry['@timestamp'],
	    body: entry
	}
	elasticsearchClient.index(document, function (error) {
	    if (error) throw error
	})
    })
}

run()
