
# Call make on sub-projects

all:
	@make -C store
	@make -C sources

destroy:
	@make -C store stack.delete &> /dev/null | true
	@make -C sources stack.delete &> /dev/null | true
