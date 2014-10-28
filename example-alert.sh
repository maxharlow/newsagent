read -ep 'Elasticsearch host: ' HOST

curl -iX POST "http://$HOST:9200/alerts-int/alert/" -d \
'{
    "name": "Unemployment rate falls under 6.2%",
    "query": {
	"type": "ons-labour-market-statistics",
	"body": {
	    "filter": {
	        "range": { "unemploymentRate": { "from": 6.2 } }
	    }
	}
    },
    "message": "The unemployment rate fell to {{unemploymentRate}} as of {{@timestamp}}",
    "notification": "log",
    "data": {
	"recipient": "example@example.com"
    }
}'
