package NnsBbs::Controller::Api;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Db;
use Data::Dumper;
use utf8;

sub newsgroup ($self) {
    my $db  = NnsBbs::Db::new();
    my $sql = "select id,name,comment from newsgroup";
    $sql .= " order by ord,name";
    my $sth  = $db->{conn}->prepare($sql);
    my $data = [];

    $sth->execute;
    while ( my $hr = $sth->fetchrow_hashref ) {
        push( @$data, $hr );
    }
    $self->render( json => $data );
}

sub titles($self) {
    my $newsgroup_id = $self->param("newsgroup_id");

    if ($newsgroup_id) {
        my $db  = NnsBbs::Db::new();
        my $sql = "select a.id as article_id ,title,reply_to,user_id";
        $sql .= ",a.created_at as date, disp_name";
        $sql .= " from article as a,user as u";
        $sql .= " where a.user_id = u.id and newsgroup_id = ?";
        $sql .= " and not a.bDeleted";
        $sql .= " order by a.id";
        my $sth = $db->{conn}->prepare($sql);
        $sth->execute($newsgroup_id);
        my $data = [];

        while ( my $hr = $sth->fetchrow_hashref ) {
            push( @$data, $hr );
        }
        $self->render( json => $data );
    }
    else {
        $self->render(
            text   => "param newsgroup_id is required",
            status => '400'
        );
    }
}

sub article($self) {
    my $newsgroup_id = $self->param("newsgroup_id");
    my $article_id   = $self->param("article_id");

    if ( !$newsgroup_id ) {
        $self->render(
            text   => "param newsgroup_id is required",
            status => '400'
        );
    }
    elsif ( !$article_id ) {
        $self->render(
            text   => "param article_id is required",
            status => '400'
        );
    }
    else {
        my $db  = NnsBbs::Db::new();
        my $sql = "select content";
        $sql .= " from article as a";
        $sql .= " where newsgroup_id = ? and id = ?";
        my $sth = $db->{conn}->prepare($sql);
        $sth->execute( $newsgroup_id, $article_id );
        my $hr = $sth->fetchrow_hashref;
        $self->render( json => $hr );
    }
}

1;
