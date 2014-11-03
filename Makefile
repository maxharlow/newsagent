
# Call make on sub-projects

all:
	@make -C store
	@make -C manage

destroy:
	@make -C store stack.delete &> /dev/null | true
	@make -C manage stack.delete &> /dev/null | true

local:
	@make -C store local
	@make -C manage local

local.start:
	@make -C store local.start
	@make -C manage local.start

local.stop:
	@make -C store local.stop
	@make -C manage local.stop
