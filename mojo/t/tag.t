use Test::More;
use Test::Mojo;
use Mojo::File qw(curfile);
use lib curfile->dirname->sibling('lib')->to_string;
use NnsBbs::Util qw(tag);

is(tag('a'), '<a></a>','simple');
is(tag('a', {href => 'foo'}), '<a href="foo"></a>', 'attr');
is(tag('a', {href => 'foo'}, 'foo','bar'), '<a href="foo">foobar</a>', 'value');

done_testing();