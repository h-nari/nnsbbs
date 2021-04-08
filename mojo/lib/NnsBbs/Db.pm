package NnsBbs::Db;

use strict;
use utf8;
use DBI;

sub new {
  my $self = shift;
  
  my $c = $self->app->config->{DB};
  my $data_src = sprintf("dbi:%s:database=%s;host=%s;port=%s",
                         $c->{TYPE}, $c->{NAME}, $c->{HOST}, $c->{PORT});
  $self->app->log->debug("data_src:$data_src");
  my $conn = DBI->connect($data_src, $c->{USER}, $c->{PASS},
                          { RaiseError => 1,
                            AutoCommit => 0, mysql_enable_utf8=>1 });
  return bless { conn => $conn };
}

sub DESTROY {
  my $self = shift;
  $self->{conn}->disconnect();
}

1;

