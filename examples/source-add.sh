read -ep 'Elasticsearch host: ' HOST
read -ep 'Source file: ' FILE

curl -iX POST "http://$HOST:9200/.sources/source/" -d @$FILE
