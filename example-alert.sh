read -p 'Elasticsearch host: ' HOST

curl -iX POST "http://$HOST:9200/alerts-int/alert/" -d \
'{
    "name": "Claimant count passes 1200",
    "query": {
	"type": "ons-labour-market-statistic",
	"body": {
	    "filter": {
		"and": [
		    { "range": { "@timestamp": { "from": "now-4M" } } },
		    { "range": { "claimantCount": { "from": 100 } } }
		]
	    }
	}
    },
    "message": "The claimant count was {{claimantCount}} as of {{@timestamp}}",
    "notification": "log",
    "data": {
	"recipient": "example@example.com"
    }
}'
