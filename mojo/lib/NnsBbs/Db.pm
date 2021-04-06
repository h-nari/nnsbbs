package NnsBbs::Db;

use strict;
use utf8;
use DBI;


sub new {
  my $class = shift;
  my $conn = DBI->connect("dbi:mysql:database=nnsbbs;host=localhost;port=3306",
                          "www-data", "warawara",
                          { RaiseError => 1, AutoCommit => 0, mysql_enable_utf8=>1 });
  return bless { conn => $conn };
}

sub DESTROY {
  my $self = shift;
  $self->{conn}->disconnect();
}

1;

