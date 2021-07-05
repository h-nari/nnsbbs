
help:
	@echo "show Makefile usage"
	@echo
	@echo "make run    run webserver in development mode"
	@echo "make fj     run webserver in development mode with fj-database"
	@echo

run:
	NNSBBS_CONF=test morbo script/nns_bbs

run-debug:
	NNSBBS_CONF=test MOJO_I18N_DEBUG=1 morbo script/nns_bbs

fj:
	NNSBBS_CONF=fj morbo script/nns_bbs
