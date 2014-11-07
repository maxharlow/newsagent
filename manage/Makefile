
# Upload and stack creation require the AWS CLI

.PHONY: target upload update stack stack.update stack.delete local

all: upload stack

target:
	@rm -rf target
	@mkdir -p target

target/manage.tar.gz: target
	@tar \
		--exclude '.*' \
		--exclude 'node_modules' \
		-czf target/manage.tar.gz \
		alerter sources

upload: target/manage.tar.gz
	@aws s3 mb \
		s3://datastash | true
	@aws s3 cp \
		--acl public-read \
		target/manage.tar.gz s3://datastash

update: stack.update
	$(eval group-name = $(shell aws cloudformation list-stack-resources \
		--stack-name 'datastash-manage' \
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

stack:
	@read -p 'This will create resources in AWS. Continue? (y/n) ' a && test $$a == 'y' || exit
	@aws cloudformation create-stack \
		--capabilities 'CAPABILITY_IAM' \
		--stack-name 'datastash-manage' \
		--template-body "$$(cat cloudformation.json)" > /dev/null
	@printf 'Creating stack'
	@while [[ $$(aws cloudformation describe-stacks --stack-name 'datastash-manage' --query 'Stacks[0].StackStatus') =~ 'CREATE_IN_PROGRESS' ]]; \
		do sleep 5 && printf '.'; done
	@printf '\n'

stack.update: upload
	@aws cloudformation update-stack \
		--capabilities 'CAPABILITY_IAM' \
		--stack-name 'datastash-manage' \
		--template-body "$$(cat cloudformation.json)" &> /dev/null | true
	@printf 'Updating stack'
	@while [[ $$(aws cloudformation describe-stacks --stack-name 'datastash-manage' --query 'Stacks[0].StackStatus') =~ 'UPDATE_IN_PROGRESS' ]]; \
		do sleep 5 && printf '.'; done
	@printf '\n'

stack.delete:
	@aws cloudformation delete-stack \
		--stack-name 'datastash-manage'
	@aws s3 rm \
		s3://datastash/manage.tar.gz
	@aws s3 rb \
		s3://datastash | true

local:
	@npm --prefix sources install
	@npm --prefix alerter install

local.run:
	@cd sources && node sources
	@cd alerter && node alerter

local.start:
	@echo 'Adding Crontab...'
	@(crontab -l 2> /dev/null; echo "@hourly export PATH=$$PATH; cd $$(pwd); (cd sources && node sources); (cd alerter && node alerter) >> datastash.log 2>&1") | crontab -

local.stop:
	@echo 'Removing Crontab...'
	@crontab -l | grep -v 'datastash' | crontab -
