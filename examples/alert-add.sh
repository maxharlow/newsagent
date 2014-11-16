read -ep 'Elasticsearch host: ' HOST
read -ep 'Source file: ' FILE
read -ep 'Recipient email address: ' EMAIL

DATA=$(sed -e "s/\$EMAIL/$EMAIL/g" $FILE)

curl -iX POST "http://$HOST:9200/.alerts/alert/" -d "$DATA"
