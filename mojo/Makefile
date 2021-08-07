
help:
	@echo "show Makefile usage"
	@echo
	@echo "make run    run webserver with morbo"
	@echo "make hyp    run webserver with hypnoatede"
	@echo "make notify run notify program"
	@echo "make test   run test"
	@echo

run:
	NNSBBS_CONF=net-kaigi morbo script/nns_bbs

hyp:
	NNSBBS_CONF=net-kaigi hypnotoad script/nns_bbs

notify:
	NNSBBS_CONF=net-kaigi perl script/nns_bbs notify -f -n

test:
	prove	t/readset.t
stop:
	NNSBBS_CONF=net-kaigi hypnotoad -s script/nns_bbs
