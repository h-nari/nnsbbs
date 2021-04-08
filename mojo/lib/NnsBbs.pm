package NnsBbs;
use Mojo::Base 'Mojolicious', -signatures;
use Data::Dumper;
    
# This method will run once at server start
sub startup ($self) {
  
  my $config = $self->plugin('NotYAMLConfig');
  $self->secrets($config->{secrets});

  $self->_load_config();

  # Router
  my $r = $self->routes;

  $r->get('/api/newsgroup')->to('api#newsgroup');
  $r->get('/api/titles')->to('api#titles');
  $r->get('/api/article')->to('api#article');
  $r->get('/index.html')->to('top#show');
  $r->get('/')->to('top#show');
  $r->get('/#newsgroup')->to('top#show');
  $r->get('/#newsgroup/:article_id')->to('top#show');
}

sub _load_config {
  my $self = shift;
  my $f;

  my $env_db = $ENV{'NNSBBS_DB'};
  
  if($env_db eq 'fj') {
    $f = $self->home->to_string . "/etc/fj-db.conf";
  } else {
    $f = $self->home->to_string . "/etc/db.conf";
  }
  if( -f $f){
    print STDERR "*** exists: $f \n";
    $self->plugin('Config', { 'file' => $f}); 
  }  else {
    print STDERR "*** not exists: $f\n";
  }
}

1;
