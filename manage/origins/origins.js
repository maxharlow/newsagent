var aws = require('aws-sdk')
var highland = require('highland')
var fs = require('fs')
var path = require('path')
var childProcess = require('child_process')
var gitty = require('gitty')
var request = require('request')
var csvParser = require('csv-parser')
var config = require('./config.json')

var sourcesLocation = path.resolve('sources')
var clonesLocation = path.resolve('.clones')

var elasticsearchHost
new aws.ELB().describeLoadBalancers({ LoadBalancerNames: [ 'datastash-store' ] }, function(error, data) {
    elasticsearchHost = error ? 'localhost' : data.LoadBalancerDescriptions[0].DNSName
})

function run() {
    fs.readdir(sourcesLocation, function (error, filenames) {
	if (error) throw error
	filenames.forEach(function (filename) {
	    fs.readFile(sourcesLocation + '/' + filename, function (error, data) {
		if (error) throw error
		var source = JSON.parse(data)
		execute(source)
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
	request({
	    uri: 'http://' + elasticsearchHost + ':' + config.elasticsearchPort + '/' + config.elasticsearchIndex + '/' + type + '/' + entry['@timestamp'],
	    method: 'PUT',
	    json: true,
	    body: entry
	})
    })
}

run()
