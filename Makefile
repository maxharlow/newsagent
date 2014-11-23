
# Call make on sub-projects

all: local local.start


local:
	@make -C store local
	@make -C sources local
	@make -C alerter local

local.start:
	@make -C store local.start
	@make -C sources local.start
	@make -C alerter local.start

local.stop:
	@make -C store local.stop
	@make -C alerter local.stop
	@make -C sources local.stop

aws:
	@make -C store aws
	@make -C sources aws
	@make -C alerter aws

aws.destroy:
	@make -C store aws.destroy
	@make -C sources aws.destroy
	@make -C alerter aws.destroy
