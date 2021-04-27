package NnsBbs::Controller::Api;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Db;
use NnsBbs::Mail;
use Data::Dumper;
use String::Random;
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
        $sql .= ",a.created_at as date, a.disp_name as disp_name";
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
        $sql .= " from article as a left join user as u on a.user_id = u.id";
        $sql .= " where newsgroup_id = ? and a.id = ?";
        $sql .= " order by rev desc limit 1";
        my $hr = $db->select_rh( $sql, $newsgroup_id, $article_id );
        $self->render( json => $hr );
    }
}

sub mail_auth($self) {
    my $email = $self->param("email");
    if ( !$email ) {
        $self->render(
            text   => "param email is required",
            status => '400'
        );
        return;
    }
    if ( $email !~ /[\w.]+@(\w+\.)*\w+/ ) {
        $self->render( json => { result => 0, mes => 'bad email format' } );
        return;
    }

    my $db    = NnsBbs::Db::new($self);
    my $sql   = "select count(*) as count from user where mail=?";
    my $rh    = $db->select_rh( $sql, $email );
    my $count = $rh->{'count'};
    if ( $count > 0 ) {
        $self->render(
            json => { result => 0, mes => 'email is already used' } );
        return;
    }
    $sql = "delete from mail_auth  where";
    $sql .= " created_at < date_sub(now(),interval 30 day) ";
    $sql .= " or email=?";
    $db->execute( $sql, $email );

    my $id = String::Random->new->randregex('[A-Za-z0-9]{12}');
    $sql = "insert into mail_auth(id,email) values (?,?)";
    $db->execute( $sql, $id, $email );
    $db->commit;

    my $url = $self->url_for("/mail_auth/$id")->to_abs;
    my $c   = "メールアドレスの認証を完了させるために\n";
    $c .= "次のURLをアクセスして下さい。\n\n";
    $c .= "   $url\n";
    $c .= "\n";
    $c .= "このメールに心当たりがない場合は\n";
    $c .= "無視して下さい。";

    NnsBbs::Mail::send( $email, "NnsBbsメール認証", $c );

    $self->render( json => { result => 1 } );
}

1;
