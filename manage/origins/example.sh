
HOST='datastash-store-1253779987.eu-west-1.elb.amazonaws.com'

curl -iX POST "http://$HOST:9200/sources-int/source/" -d \
'{
    "name": "ONS Labour Market Statistics",
    "location": "https://github.com/maxharlow/scrape-ons-labour.git",
    "install": "npm install",
    "run": "node ons-labour",
    "output": "ons-labour.csv",
    "timestampedBy": "date"
}'
