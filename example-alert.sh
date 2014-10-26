read -p 'Elasticsearch host: ' HOST

curl -iX POST "http://$HOST:9200/alerts-int/alert/" -d \
'{
    "name": "Unemployment rate in England passes 6.1m",
    "query": {
	"type": "labour",
	"body": {
	    "filter": {
		"and": [
		    { "range": { "@timestamp": { "from": "now-4M" } } },
		    { "range": { "unemploymentRate": { "from": 6.1 } } }
		]
	    },
	    "query": {
		"match": { "country": "England" }
	    }
	}
    },
    "message": "The unemployment rate in England was {{unemploymentRate}} as of {{@timestamp}}",
    "notification": "log",
    "data": {
	"recipient": "example@example.com"
    }
}'
