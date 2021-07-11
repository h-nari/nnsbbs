package NnsBbs::Db;

use strict;
use utf8;
use DBI;

sub new {
    my $self = shift;

    my $c        = $self->app->config->{DB};
    my $data_src = sprintf( "dbi:%s:database=%s;host=%s;port=%s",
        $c->{TYPE}, $c->{NAME}, $c->{HOST}, $c->{PORT} );
    $self->app->log->debug("data_src:$data_src");
    my $conn = DBI->connect(
        $data_src,
        $c->{USER},
        $c->{PASS},
        {
            RaiseError        => 1,
            AutoCommit        => 0,
            mysql_enable_utf8 => 1
        }
    );
    return bless { conn => $conn };
}

sub commit {
    my $self = shift;
    $self->{conn}->commit;
}

sub execute {
    my ( $self, $sql, @params ) = @_;
    my $sth = $self->{conn}->prepare($sql);
    $sth->execute(@params);
}

sub select_aa {
    my ( $self, $sql, @params ) = @_;
    my $sth = $self->{conn}->prepare($sql);
    $sth->execute(@params);
    return $sth->fetchall_arrayref;
}

sub select_ah {
    my ( $self, $sql, @params ) = @_;
    my $sth = $self->{conn}->prepare($sql);
    $sth->execute(@params);
    my $a = [];
    while ( my $hr = $sth->fetchrow_hashref ) {
        push( @$a, $hr );
    }
    return $a;
}

sub select_rh {
    my ( $self, $sql, @params ) = @_;
    my $sth = $self->{conn}->prepare($sql);
    $sth->execute(@params);
    return $sth->fetchrow_hashref;
}

sub select_ra {
    my ( $self, $sql, @params ) = @_;
    my $sth = $self->{conn}->prepare($sql);
    $sth->execute(@params);
    return $sth->fetchrow_array;
}

sub select_hh {
    my ( $self, $sql, $key_field, @params ) = @_;
    my $sth = $self->{conn}->prepare($sql);
    $sth->execute(@params);
    return $sth->fetchall_hashref($key_field);
}

sub DESTROY {
    my $self = shift;
    $self->{conn}->disconnect();
}

sub init_data {
    my $db         = shift;
    my $controller = shift;
    my $session_id = $controller->session('id');
    my $data       = {};
    $data->{membership} =
      $db->select_hh( "select * from membership order by id", 'id' );
    $data->{reaction_type} =
      $db->select_hh( 'select id,name,icon from reaction_type', 'id' );
    $data->{login} = 0;
    if ($session_id) {
        $db->update_session;
        my $sql = "select disp_name, u.id as id";
        $sql .= ",membership_id,signature,moderator,theme,setting";
        $sql .= " from user as u,session as s";
        $sql .= " where u.id = s.user_id and s.id=?";
        my $rh = $db->select_rh( $sql, $session_id );
        if ($rh) {
            $data->{user}  = $rh;
            $data->{login} = 1;
        }
    }
    $data->{version}  = $controller->app->{npm_version} || 'v0.0.0';
    $data->{bbs_name} = $controller->app->config->{NAME} || 'nnsbbs';
    $data->{wiki_url} = $controller->app->config->{WIKI_URL} || '';
    $data->{top_url}  = $controller->app->config->{TOP_URL} || '';
    return $data;
}

sub update_session {
    my $db  = shift;
    my $sql = "delete from session";
    $sql .= " where (subtime(now(),created_at) > '72:00:00')";
    $sql .= " or (subtime(now(),created_at) > '24:00:00'";
    $sql .= " and subtime(now(),last_access) > '3:00:00')";
    $db->execute($sql);
    $db->commit;
}

1;

