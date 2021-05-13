
help:
	@echo "show Makefile usage"
	@echo
	@echo "make run    run webserver in development mode"
	@echo "make fj     run webserver in development mode with fj-database"
	@echo

run:
	morbo script/nns_bbs
run-debug:
	MOJO_I18N_DEBUG=1 morbo script/nns_bbs

fj:
	NNSBBS_DB=fj morbo script/nns_bbs
