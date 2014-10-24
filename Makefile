
# Call make on sub-projects

all:
	@make -C store
	@make -C manage

destroy:
	@make -C store stack.delete &> /dev/null | true
	@make -C manage stack.delete &> /dev/null | true
