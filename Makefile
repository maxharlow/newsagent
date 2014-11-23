
# Call make on sub-projects

all:
	@make -C store
	@make -C sources
	@make -C alerter

destroy:
	@make -C store stack.delete &> /dev/null | true
	@make -C sources stack.delete &> /dev/null | true
	@make -C alerter stack.delete &> /dev/null | true

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
