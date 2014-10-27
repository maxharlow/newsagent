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
	elasticsearchClient = new elasticsearch.Client({ host: elasticsearchHost + ':' + config.elasticsearch.port })
	elasticsearchClient.search({index: 'sources-int'}, function (error, response) {
	    if (error) throw error
	    response.hits.hits.forEach(function (hit) {
		execute(hit._source)
	    })
	})
    })
}

function execute(source) {
    var id = source.name.replace(/ /g, '-').toLowerCase()
    var location = clonesLocation + '/' + id
    console.log('Executing: ' + source.name)
    fs.mkdir(location, function (error) {
	if (error && error.code !== 'EEXIST' && error.code !== 'ENOENT') throw error
	gitty.clone(location, source.location, function (error) {
	    if (error && error.indexOf('already exists') < 0) throw error
	    gitty(location).pull('origin', 'master', function (error) {
	    	if (error) throw error
		console.log('Installing...')
		childProcess.exec('cd ' + location + ';' + source.install, function (error, installLog) {
		    if (error) throw error
		    console.log(installLog)
		    console.log('Running...')
		    childProcess.exec('cd ' + location + ';' + source.run, function (error, runLog) {
			if (error) throw error
			console.log(runLog) // todo: store results in file
			load(source, location, id)
		    })
		})
	    })
	})
    })
}

function load(source, location, type) {
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
	    index: config.elasticsearch.index,
	    type: type,
	    id: entry['@timestamp'],
	    body: entry
	}
	elasticsearchClient.index(document, function (error) {
	    if (error) throw error
	})
    })
}

run()
