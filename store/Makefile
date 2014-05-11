
# Upload and stack creation require the AWS CLI
# Upload requires an S3 bucket named 'datastash'

elasticsearch-version = 1.1.1
kibana-version = 3.0.1
aws-region = eu-west-1

all: upload stack

elasticsearch:
	wget -O elasticsearch.tar.gz https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-$(elasticsearch-version).tar.gz
	@tar xf elasticsearch.tar.gz
	@rm elasticsearch.tar.gz
	@mv elasticsearch-$(elasticsearch-version) elasticsearch
	./elasticsearch/bin/plugin -install elasticsearch/elasticsearch-cloud-aws/2.1.1
	./elasticsearch/bin/plugin -install mobz/elasticsearch-head
	./elasticsearch/bin/plugin -install lukas-vlcek/bigdesk/2.4.0
	./elasticsearch/bin/plugin -install karmi/elasticsearch-paramedic
	@cp config/elasticsearch.yml elasticsearch/config/elasticsearch.yml
	@cp config/elasticsearch-logging.yml elasticsearch/config/logging.yml

kibana:
	wget -O kibana.tar.gz https://download.elasticsearch.org/kibana/kibana/kibana-$(kibana-version).tar.gz
	@tar xf kibana.tar.gz
	@rm kibana.tar.gz
	@mv kibana-$(kibana-version) kibana

artifact: elasticsearch kibana
	@tar czf store.tar.gz \
		elasticsearch \
		kibana \
		-C config \
		elasticsearch.conf \
		nginx.conf \
		nginx-sites.conf
	@rm -r elasticsearch kibana

upload: artifact
	aws s3 mv --region $(aws-region) --acl public-read store.tar.gz s3://datastash/

stack:
	@aws cloudformation create-stack \
		--region $(aws-region) \
		--capabilities 'CAPABILITY_IAM' \
		--stack-name 'datastash-store' \
		--template-body "$$(cat cloudformation.json)"

stack.delete:
	@aws cloudformation delete-stack \
		--region $(aws-region) \
		--stack-name 'datastash-store'

local: elasticsearch kibana local.stop
	@mkdir -p .local
	@rm -rf .local/elasticsearch
	@mv elasticsearch .local
	@ln -sf config/elasticsearch.yml $(shell pwd)/.local/elasticsearch/config/elasticsearch.yml
	@ln -sf config/elasticsearch-logging.yml $(shell pwd)/.local/elasticsearch/config/logging.yml
	@rm -rf .local/kibana
	@mv kibana .local

local.start:
	@./.local/elasticsearch/bin/elasticsearch -d \
		--index.number_of_replicas=0 \
		--path.conf=.local/elasticsearch/config \
		--path.data=.local/data \
		--path.logs=.local/logs \
		--gateway.expected_nodes=1 \
		--gateway.recover_after_nodes=1 \
		--discovery.type=zen
	@cd .local/kibana && (python -m SimpleHTTPServer 8000 &> /dev/null &) && cd ../..
	@echo 'Elasticsearch now running at http://localhost:9200/_plugin/head/'
	@echo 'Kibana now running at        http://localhost:8000/'

local.stop:
	@pkill -f SimpleHTTPServer | true
	@pkill -f org.elasticsearch | true
