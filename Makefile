
# Call make on sub-projects

all:
	@make -C store
	@make -C sources

delete:
	@make -C store stack.delete
	@make -C sources stack.delete

