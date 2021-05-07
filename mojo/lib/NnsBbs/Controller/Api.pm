package NnsBbs::Controller::Api;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Db;
use NnsBbs::Mail;
use Data::Dumper;
use String::Random;
use utf8;

sub newsgroup ($self) {
    my $db  = NnsBbs::Db::new($self);
    my $sql = "select id,name,comment,max_id,posted_at from newsgroup";
    $sql .= " where not bDeleted";
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
        my $sql = "select id as article_id ,title,reply_to";
        $sql .= ",created_at as date,user_id,disp_name";
        $sql .= " from article";
        $sql .= " where newsgroup_id = ?";
        $sql .= " and not bDeleted";

        my @params = ($newsgroup_id);
        if ($from) {
            $sql .= " and id >= ?";
            push @params, $from;
        }
        if ($to) {
            $sql .= "and id <= ?";
            push @params, $to;
        }
        $sql .= " order by id";
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
        my $db  = NnsBbs::Db::new($self);
        my $sql = "select content,created_at as date,disp_name as author";
        $sql .= ",title,rev,id as article_id,user_id";
        $sql .= " from article";
        $sql .= " where newsgroup_id = ? and id = ?";
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

sub profile_read {
    my $self    = shift;
    my $user_id = $self->param('user_id');

    if ( !$user_id ) {
        $self->render( text => 'user_id required', status => '400' );
    }
    else {
        my $db  = NnsBbs::Db::new($self);
        my $sql = "select mail,disp_name,created_at,logined_at";
        $sql .= ",membership_id,profile from user where id=?";
        my $ra = $db->select_rh( $sql, $user_id );
        $self->render( json => $ra ? $ra : {} );
    }
}

sub profile_write {
    my $self       = shift;
    my $user_id    = $self->param('user_id');
    my $name       = $self->param('name');
    my $profile    = $self->param('profile');
    my $membership_id = $self->param('membership_id');

    if ( !$user_id ) {
        $self->render( text => 'user_id is required', status => '400' );
    }
    elsif ( !$name && !$profile && !$membership_id) {
        $self->render( text => 'name or profile or membership_id is required', status => '400' );
    }
    else {
        my $db  = NnsBbs::Db::new($self);
        my $sql = "update user set disp_name=? where id=?";
        $db->execute( $sql, $name, $user_id ) if $name;
        $sql = "update user set profile=? where id=?";
        $db->execute( $sql, $profile, $user_id ) if $profile;
        $sql = "update user set membership_id=? where id=?";
        $db->execute( $sql, $membership_id, $user_id ) if $membership_id;
        $db->commit;
        $self->render( json => { result => 'Ok' } );
    }
}

sub post_article {
    my $self          = shift;
    my $ip            = $self->client_ip;
    my $newsgroup_id  = $self->param('newsgroup_id');
    my $title         = $self->param('title');
    my $user_id       = $self->param('user_id');
    my $disp_name     = $self->param('disp_name');
    my $content       = $self->param('content');
    my $reply_to      = $self->param('reply_to') || 0;
    my $reply_rev     = $self->param('reply_rev') || 0;
    my @missing_param = ();

    push( @missing_param, 'newsgroup_id' ) unless $newsgroup_id;
    push( @missing_param, 'title' )        unless $title;
    push( @missing_param, 'user_id' )      unless $user_id;
    push( @missing_param, 'disp_name' )    unless $disp_name;
    push( @missing_param, 'content' )      unless $content;

    if ( @missing_param > 0 ) {
        $self->render(
            text => 'parameter ',
            join( ',', @missing_param ) . ' are missing',
            status => '400'
        );
        return;
    }
    my $db = NnsBbs::Db::new($self);

    # TODO: ckeck user permissions

    my $sql = "select max_id from newsgroup where id=? for update";
    my ($max_id) = $db->select_ra( $sql, $newsgroup_id );
    my $article_id = $max_id + 1;
    $sql = "update newsgroup set max_id=?,posted_at=now() where id=?";
    $db->execute( $sql, $article_id, $newsgroup_id );

    $sql = "insert into article";
    $sql .= "(newsgroup_id,id,title,reply_to,reply_rev,";
    $sql .= "user_id,disp_name,ip,content)";
    $sql .= "values(?,?,?,?,?,?,?,?,?)";
    $db->execute(
        $sql,       $newsgroup_id, $article_id, $title, $reply_to,
        $reply_rev, $user_id,      $disp_name,  $ip,    $content
    );
    $db->commit;
    $self->render( json => { result => 'ok', article_id => $article_id } );
}

1;
