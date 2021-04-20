package NnsBbs::Controller::Api;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Db;
use Data::Dumper;
use utf8;

sub newsgroup ($self) {
    my $db  = NnsBbs::Db::new($self);
    my $sql = "select id,name,comment,max_id from newsgroup";
    $sql .= " order by ord,name";
    my $data = $db->select_ah($sql);
    $self->render( json => $data );
}

sub titles($self) {
    my $newsgroup_id = $self->param("newsgroup_id");
    my $from         = $self->param("from");
    my $to           = $self->param("to");

    if ($newsgroup_id) {
        my $db  = NnsBbs::Db::new($self);
        my $sql = "select a.id as article_id ,title,reply_to,user_id";
        $sql .= ",a.created_at as date, disp_name";
        $sql .= " from article as a left join user as u on a.user_id = u.id";
        $sql .= " where newsgroup_id = ?";
        $sql .= " and not a.bDeleted";

        my @params = ($newsgroup_id);
        if ($from) {
            $sql .= " and a.id >= ?";
            push @params, $from;
        }
        if ($to) {
            $sql .= "and a.id <= ?";
            push @params, $to;
        }
        $sql .= " order by a.id";
        my $data = $db->select_ah( $sql, @params );
        print STDERR "newsgroup=", $newsgroup_id, " count=", ( @$data + 0 ),
          "\n";
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
        my $db = NnsBbs::Db::new($self);
        my $sql =
          "select content,a.created_at as date,u.disp_name as author,title";
        $sql .= " from article as a,user as u";
        $sql .= " where a.user_id= u.id and newsgroup_id = ? and a.id = ?";

        my $hr = $db->select_rh( $sql, $newsgroup_id, $article_id );
        $self->render( json => $hr );
    }
}

1;
