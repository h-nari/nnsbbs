use Mojo::Base -strict;

use Test::More;
use Test::Mojo;
use Mojo::File qw(curfile);
use lib curfile->dirname->sibling('lib')->to_string;

my $t = Test::Mojo->new('NnsBbs');
$t->get_ok('/')->status_is(200);

done_testing();
