
# Upload and stack creation require the AWS CLI

elasticsearch-version = 1.3.2
kibana-version = 3.1.0

.PHONY: target.clean upload update stack stack.update stack.delete local local.start local.stop

all: upload stack

target:
	@mkdir -p target

target.clean:
	@rm -r target

target/elasticsearch: | target
	@curl -o target/elasticsearch.tar.gz https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-$(elasticsearch-version).tar.gz
	@tar xf target/elasticsearch.tar.gz -C target
	@rm target/elasticsearch.tar.gz
	@mv target/elasticsearch-$(elasticsearch-version) target/elasticsearch
	@./target/elasticsearch/bin/plugin -install elasticsearch/elasticsearch-cloud-aws/2.2.0
	@./target/elasticsearch/bin/plugin -install mobz/elasticsearch-head
	@./target/elasticsearch/bin/plugin -install lukas-vlcek/bigdesk/2.4.0
	@./target/elasticsearch/bin/plugin -install karmi/elasticsearch-paramedic
	@cp config/elasticsearch.yml target/elasticsearch/config/elasticsearch.yml
	@cp config/elasticsearch-logging.yml target/elasticsearch/config/logging.yml

target/kibana: | target
	@curl -o target/kibana.tar.gz https://download.elasticsearch.org/kibana/kibana/kibana-$(kibana-version).tar.gz
	@tar xf target/kibana.tar.gz -C target
	@rm target/kibana.tar.gz
	@mv target/kibana-$(kibana-version) target/kibana

target/store.tar.gz: target/elasticsearch target/kibana
	@tar czf target/store.tar.gz \
		-C config elasticsearch.conf nginx.conf nginx-sites.conf \
		-C ../target elasticsearch kibana

upload: target/store.tar.gz
	@aws s3 mb \
		s3://datastash | true
	@aws s3 cp \
		--acl public-read \
		target/store.tar.gz s3://datastash

update: stack.update
	$(eval group-name = $(shell aws cloudformation list-stack-resources \
		--stack-name 'datastash-store' \
		--query 'StackResourceSummaries[?ResourceType==`AWS::AutoScaling::AutoScalingGroup`].PhysicalResourceId' \
		--output text))
	$(eval group-max = $(shell aws autoscaling describe-auto-scaling-groups \
		--auto-scaling-group-names $(group-name) \
		--query 'AutoScalingGroups[0].MaxSize'))
	$(eval group-desired = $(shell aws autoscaling describe-auto-scaling-groups \
		--auto-scaling-group-names $(group-name) \
		--query 'AutoScalingGroups[0].DesiredCapacity'))
	$(eval group-desired-double = $(shell bc <<< '$(group-desired) * 2'))
	$(eval loadbalancer = $(shell aws cloudformation describe-stacks \
		--stack-name 'datastash-store' \
		--query 'Stacks[0].Outputs[?OutputKey==`LoadBalancer`].OutputValue' \
		--output text))
	@test $(group-desired-double) -le $(group-max)
	@test $$(curl -s '$(loadbalancer):9200/_cat/health?h=status') == 'green'
	@aws autoscaling set-desired-capacity \
		--auto-scaling-group-name $(group-name) \
		--desired-capacity $(group-desired-double)
	@printf 'Starting new machines'
	@while [[ $$(curl -s '$(loadbalancer):9200/_cat/health?h=node.total') -ne $(group-desired-double) ]]; \
		do sleep 5 && printf '.'; done
	@printf '\n'
	@printf 'Terminating old machines'
	@for c in $$(seq $(group-desired-double) $(group-desired)); \
		do \
		while [[ $$(curl -s '$(loadbalancer):9200/_cat/health?h=status') -ne 'green' ]]; \
			do sleep 5 && printf ' '; done; \
		aws autoscaling set-desired-capacity --auto-scaling-group-name $(group-name) --desired-capacity $$c; \
		while [[ $$(curl -s '$(loadbalancer):9200/_cat/health?h=node.total') -ne $$c ]]; \
			do sleep 5 && printf '.'; done; \
		done
	@printf '\n'

stack:
	@aws cloudformation create-stack \
		--capabilities 'CAPABILITY_IAM' \
		--stack-name 'datastash-store' \
		--template-body "$$(cat cloudformation.json)" > /dev/null
	@printf 'Creating stack'
	@while [[ $$(aws cloudformation describe-stacks --stack-name 'datastash-store' --query 'Stacks[0].StackStatus') =~ 'CREATE_IN_PROGRESS' ]]; \
		do sleep 5 && printf '.'; done
	@printf '\n'
	@printf '(now wait for Elasticsearch to start...)\n'

stack.update: upload
	@aws cloudformation update-stack \
		--capabilities 'CAPABILITY_IAM' \
		--stack-name 'datastash-store' \
		--template-body "$$(cat cloudformation.json)" &> /dev/null | true
	@printf 'Updating stack'
	@while [[ $$(aws cloudformation describe-stacks --stack-name 'datastash-store' --query 'Stacks[0].StackStatus') =~ 'UPDATE_IN_PROGRESS' ]]; \
		do sleep 5 && printf '.'; done
	@printf '\n'

stack.delete:
	@aws cloudformation delete-stack \
		--stack-name 'datastash-store'
	@aws s3 rm \
		s3://datastash/store.tar.gz
	@aws s3 rb \
		s3://datastash

local: target/elasticsearch target/kibana local.stop
	@mkdir -p .local
	@rm -rf .local/elasticsearch
	@cp -r target/elasticsearch .local
	@ln -sf config/elasticsearch.yml $(shell pwd)/.local/elasticsearch/config/elasticsearch.yml
	@ln -sf config/elasticsearch-logging.yml $(shell pwd)/.local/elasticsearch/config/logging.yml
	@rm -rf .local/kibana
	@cp -r target/kibana .local

local.start:
	@./.local/elasticsearch/bin/elasticsearch -d \
		--index.number_of_replicas=0 \
		--path.conf=.local/elasticsearch/config \
		--path.data=.local/data \
		--path.logs=.local/logs \
		--gateway.expected_nodes=1 \
		--gateway.recover_after_nodes=1 \
		--discovery.type=zen &> /dev/null
	@cd .local/kibana && (python -m SimpleHTTPServer 8000 &> /dev/null &) && cd ../..
	@echo 'Elasticsearch now running at http://localhost:9200/_plugin/head/'
	@echo 'Kibana now running at        http://localhost:8000/'

local.stop:
	@pkill -f SimpleHTTPServer | true
	@pkill -f org.elasticsearch | true
