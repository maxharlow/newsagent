
# Upload and stack creation require the AWS CLI

.PHONY: target local local.run local.start local.stop aws aws.upload aws.update aws.update.stack aws.destroy


all: local local.start


target:
	@rm -rf target
	@mkdir -p target

target/sources.tar.gz: target
	@cp ~/.ssh/id_rsa.pub target/authorized_keys
	@tar \
		--exclude '.*' \
		--exclude 'node_modules' \
		-czf target/sources.tar.gz \
		-C target authorized_keys \
		-C .. sources.js package.json config.json


local:
	@npm install

local.run:
	@node sources

local.start:
	@echo 'Adding Sources Crontab...'
	@(crontab -l 2> /dev/null; echo "@hourly export PATH=$$PATH; cd $$(pwd); node sources >> datastash-sources.log 2>&1") | crontab -

local.stop:
	@echo 'Removing Sources Crontab...'
	@crontab -l | grep -v 'datastash-sources' | crontab -


aws: aws.upload
	@read -p 'This will create resources in AWS. Continue? (y/n) ' a && test $$a == 'y' || exit
	@aws cloudformation create-stack \
		--capabilities 'CAPABILITY_IAM' \
		--stack-name 'datastash-sources' \
		--template-body "$$(cat cloudformation.json)" > /dev/null
	@printf 'Creating stack'
	@while [[ $$(aws cloudformation describe-stacks --stack-name 'datastash-sources' --query 'Stacks[0].StackStatus') =~ 'CREATE_IN_PROGRESS' ]]; \
		do sleep 5 && printf '.'; done
	@printf '\n'

aws.upload: target/sources.tar.gz
	@aws s3 mb \
		s3://datastash | true
	@aws s3 cp \
		--acl public-read \
		target/sources.tar.gz s3://datastash

aws.update: aws.update.stack
	$(eval group-name = $(shell aws cloudformation list-stack-resources \
		--stack-name 'datastash-sources' \
		--query 'StackResourceSummaries[?ResourceType==`AWS::AutoScaling::AutoScalingGroup`].PhysicalResourceId' \
		--output text))
	$(eval group-max = $(shell aws autoscaling describe-auto-scaling-groups \
		--auto-scaling-group-names $(group-name) \
		--query 'AutoScalingGroups[0].MaxSize'))
	$(eval group-desired = $(shell aws autoscaling describe-auto-scaling-groups \
		--auto-scaling-group-names $(group-name) \
		--query 'AutoScalingGroups[0].DesiredCapacity'))
	$(eval group-desired-double = $(shell bc <<< '$(group-desired) * 2'))
	@test $(group-desired-double) -le $(group-max)
	@aws autoscaling set-desired-capacity \
		--auto-scaling-group-name $(group-name) \
		--desired-capacity $(group-desired-double)
	@printf 'Starting new machines'
	@while [[ $$(aws autoscaling describe-auto-scaling-groups \
		--auto-scaling-group-names $(group-name) \
		--query 'length(AutoScalingGroups[0].Instances[?LifecycleState==`InService`])') -ne $(group-desired-double) ]]; \
		do sleep 5 && printf '.'; done
	@printf '\n'
	@printf 'Terminating old machines...'
	@aws autoscaling set-desired-capacity \
		--auto-scaling-group-name $(group-name) \
		--desired-capacity $(group-desired)
	@printf '\n'


aws.update.stack: aws.upload
	@aws cloudformation update-stack \
		--capabilities 'CAPABILITY_IAM' \
		--stack-name 'datastash-sources' \
		--template-body "$$(cat cloudformation.json)" &> /dev/null | true
	@printf 'Updating stack'
	@while [[ $$(aws cloudformation describe-stacks --stack-name 'datastash-sources' --query 'Stacks[0].StackStatus') =~ 'UPDATE_IN_PROGRESS' ]]; \
		do sleep 5 && printf '.'; done
	@printf '\n'

aws.destroy:
	@aws cloudformation delete-stack \
		--stack-name 'datastash-sources'
	@aws s3 rm \
		s3://datastash/sources.tar.gz
	@aws s3 rb \
		s3://datastash | true
