read -ep 'Elasticsearch host: ' HOST
read -ep 'Your email address: ' EMAIL

curl -iX POST "http://$HOST:9200/alerts-int/alert/" -d @- <<EOT
{
    "name": "Unemployment rate falls under 6.2%",
    "query": {
	"type": "ons-labour-market-statistics",
	"body": {
	    "filter": {
	        "range": { "unemploymentRate": { "to": 6.2 } }
	    }
	}
    },
    "message": "The unemployment rate fell to {{unemploymentRate}} as of {{@timestamp}}",
    "notification": "email",
    "data": {
	"recipient": "$EMAIL"
    }
}
EOT
