use Mojo::Base -strict;

use Test::More;
use Test::Mojo;
use Mojo::File qw(curfile);
use lib curfile->dirname->sibling('lib')->to_string;
use NnsBbs::ReadSet;
use Data::Dumper;

my $rs = NnsBbs::ReadSet->new();
is($rs->toString,'', 'new');
is($rs->count, 0);

$rs->add_range(1);
is($rs->toString,'1','add_rage');
is($rs->count, 1);

$rs->add_range(3,6);
is($rs->toString,'1,3-6','add_range');
is($rs->count, 5);

$rs->add_range(1,4);
is($rs->toString,'1-6', 'add_range');
is($rs->count, 6);

$rs->sub_range(2);
is($rs->toString,'1,3-6', 'sub_range');
is($rs->count, 5);

$rs->sub_range(1,4);
is($rs->toString,'5-6', 'sub_range');
is($rs->count, 2);

$rs = NnsBbs::ReadSet->new('1-3, 5-7, 9');
is($rs->toString, '1-3,5-7,9','new with string');

$rs->fromString('1,2,3');
is($rs->toString,'1-3', 'fromString');

done_testing();
