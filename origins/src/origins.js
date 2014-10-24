var highland = require('highland')
var fs = require('fs')
var path = require('path')
var childProcess = require('child_process')
var gitty = require('gitty')
var request = require('request')
var csvParser = require('csv-parser')
var config = require('../config.json')

var scrapersLocation = path.resolve('../scrapers')
var clonesLocation = path.resolve('../.clones')

var elasticsearchLocation = 'localhost:9200' // todo look this up

function run() {
    fs.readdir(scrapersLocation, function (error, filenames) {
	if (error) throw error
	filenames.forEach(function (filename) {
	    fs.readFile(scrapersLocation + '/' + filename, function (error, data) {
		if (error) throw error
		var scraper = JSON.parse(data)
		execute(scraper)
	    })
	})
    })
}

function execute(scraper) {
    var id = scraper.name.replace(/ /g, '-').toLowerCase()
    var location = clonesLocation + '/' + id
    console.log('Executing: ' + scraper.name)
    fs.mkdir(location, function (error) {
	if (error && error.code !== 'EEXIST' && error.code !== 'ENOENT') throw error
	gitty.clone(location, scraper.location, function (error) {
	    if (error && error.indexOf('already exists') < 0) throw error
	    gitty(location).pull('origin', 'master', function (error) {
	    	if (error) throw error
		console.log('Installing...')
		childProcess.exec('cd ' + location + ';' + scraper.install, function (error, installLog) {
		    if (error) throw error
		    console.log(installLog)
		    console.log('Running...')
		    childProcess.exec('cd ' + location + ';' + scraper.run, function (error, runLog) {
			if (error) throw error
			console.log(runLog) // todo: store results in file
			load(scraper, location, id)
		    })
		})
	    })
	})
    })
}

function load(scraper, location, type) {
    var datafile = highland(fs.createReadStream(location + '/' + scraper.output)).through(csvParser())
    var data = datafile.map(function (entry) {
	entry['@timestamp'] = entry[scraper.timestampedBy]
	delete entry[scraper.timestampedBy]
	for (var property in entry) {
	    entry[property] = Number(entry[property]) || entry[property]
	}
	return entry
    })
    data.each(function (entry) {
	request({
	    uri: 'http://' + elasticsearchLocation + '/' + config.elasticsearchIndex + '/' + type + '/' + entry['@timestamp'],
	    method: 'PUT',
	    json: true,
	    body: entry
	})
    })
}

run()
