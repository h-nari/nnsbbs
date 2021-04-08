package NnsBbs::Controller::Top;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Db;
use Data::Dumper;

sub show ($self) {

  print STDERR "++++ self:", $self,"\n";
  my $db = NnsBbs::Db::new($self);
  my $newsgroup = $self->param('newsgroup') || "";
  my $article_id = $self->param('article_id') || "";

  print STDERR "*** $newsgroup/$article_id\n";
  $self->stash(script_part => "<script>\$(()=>{nssbss.top_page(\"$newsgroup\",\"$article_id\");});</script>",
               msg => "Welcome to nnsbbs: NetNews styled BBS!");
  $self->render();
}

1;
