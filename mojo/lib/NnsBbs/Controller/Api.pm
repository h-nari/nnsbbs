package NnsBbs::Controller::Api;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Db;
use NnsBbs::Mail;
use NnsBbs::Util qw/access_level random_id/;
use Data::Dumper;
use String::Random;
use JSON;
use utf8;

sub newsgroup ($self) {
    my $db = NnsBbs::Db::new($self);
    my ( $level, $moderator ) = access_level( $self, $db );

    my $sql   = "select * from newsgroup";
    my @param = ();
    unless ($moderator) {
        $sql .= " where not bDeleted and ? >= rpl";
        push( @param, $level );
    }
    $sql .= " order by ord,name";
    my $data = $db->select_ah( $sql, @param );

    $self->render( json => $data );
}

sub titles($self) {
    my $newsgroup_id = $self->param("newsgroup_id");
    my $from         = $self->param("from");
    my $to           = $self->param("to");

    eval {
        die "newsgroup_id is required\n" unless ($newsgroup_id);
        my $db = NnsBbs::Db::new($self);
        my ( $level, $moderator ) = access_level( $self, $db );
        my ($rpl) = $db->select_ra( "select rpl from newsgroup where id=?",
            $newsgroup_id );
        die "no read permission.\n"
          if ( ( !defined($rpl) || $rpl > $level ) && !$moderator );
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
        $self->render( json => $data );
    };
    $self->render( text => $@, status => '400' ) if $@;
}

sub article($self) {
    my $newsgroup_id = $self->param("newsgroup_id");
    my $article_id   = $self->param("article_id");
    my $rev          = $self->param("rev") || '0';

    eval {
        die "param newsgroup_id is required\n" unless ($newsgroup_id);
        die "param article_id is required\n"   unless ($article_id);
        my $db = NnsBbs::Db::new($self);
        my ( $level, $moderator ) = access_level( $self, $db );
        my ($rpl) = $db->select_ra( "select rpl from newsgroup where id=?",
            $newsgroup_id );
        die "No read permission.\n"
          if ( ( !defined($rpl) || $rpl > $level ) && !$moderator );

        my $sql = "select content,created_at as date,disp_name as author";
        $sql .= ",title,rev,id as article_id,user_id";
        $sql .= " from article";
        $sql .= " where newsgroup_id = ? and id = ? and rev=?";
        $sql .= " order by rev desc limit 1";
        my $hr = $db->select_rh( $sql, $newsgroup_id, $article_id, $rev );

        $sql = "select file_id,comment,filename,content_type";
        $sql .= ",length(data) as size";
        $sql .= " from attachment as a,attached_file as f";
        $sql .= " where a.file_id=f.id and newsgroup_id=?";
        $sql .= " and article_id=? and rev=?";
        $sql .= " order by ord";
        my $ah = $db->select_ah( $sql, $newsgroup_id, $article_id, $rev );
        $hr->{'attachment'} = $ah;
        $self->render( json => $hr );
    };
    $self->render( text => $@, status => '400' ) if ($@);
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
        my $sql = "select disp_name,created_at";
        $sql .= ",membership_id,profile";
        $sql .= ",signature,subsInfo,mail";
        $sql .= "  from user where id=?";
        my $ra = $db->select_rh( $sql, $user_id );
        $self->render( json => $ra ? $ra : {} );
    }
}

sub profile_write {
    my $self          = shift;
    my $user_id       = $self->param('user_id');
    my $disp_name     = $self->param('disp_name');
    my $profile       = $self->param('profile');
    my $membership_id = $self->param('membership_id');
    my $signature     = $self->param('signature');
    my $subsInfo      = $self->param('subsInfo');

    eval {
        die "user_id is required\n" unless ($user_id);
        die "name,profile,membership_id,signature of subsInfo is required\n"
          if ( !$disp_name
            && !$profile
            && !$membership_id
            && !$signature
            && !$subsInfo );
        my $db = NnsBbs::Db::new($self);
        my ( $level, $moderator, $admin, $user_id2 ) =
          access_level( $self, $db );
        die "no write profile permission\n"
          unless ( ( $user_id eq $user_id2 ) || $moderator );
        my $sql = "update user set disp_name=? where id=?";
        $db->execute( $sql, $disp_name, $user_id ) if $disp_name;
        $sql = "update user set profile=? where id=?";
        $db->execute( $sql, $profile, $user_id ) if $profile;
        $sql = "update user set membership_id=? where id=?";
        $db->execute( $sql, $membership_id, $user_id ) if $membership_id;
        $sql = "update user set signature? where id=?";
        $db->execute( $sql, $signature, $user_id ) if $signature;
        $sql = "update user set subsInfo=? where id=?";
        $db->execute( $sql, $subsInfo, $user_id ) if $subsInfo;

        $db->commit;
        $self->render( json => { result => 'ok' } );
    };
    $self->render( text => $@, status => '400' ) if $@;
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

    eval {
        push( @missing_param, 'newsgroup_id' ) unless $newsgroup_id;
        push( @missing_param, 'title' )        unless $title;
        push( @missing_param, 'user_id' )      unless $user_id;
        push( @missing_param, 'disp_name' )    unless $disp_name;
        push( @missing_param, 'content' )      unless $content;

        die 'parameter ' . join( ',', @missing_param ) . " are missing\n"
          if ( @missing_param > 0 );

        my $db = NnsBbs::Db::new($self);
        my ( $level, $moderator ) = access_level( $self, $db );
        my ($wpl) = $db->select_ra( "select wpl from newsgroup where id=?",
            $newsgroup_id );

        die "no write permission" if ( !$moderator && $level < $wpl );

        my $sql        = "select max_id from newsgroup where id=? for update";
        my ($max_id)   = $db->select_ra( $sql, $newsgroup_id );
        my $article_id = $max_id + 1;
        $sql = "update newsgroup set max_id=?,posted_at=now() where id=?";
        $db->execute( $sql, $article_id, $newsgroup_id );

        $sql = "insert into article";
        $sql .= "(newsgroup_id,id,title,reply_to,reply_rev,";
        $sql .= "user_id,disp_name,ip,content)";
        $sql .= "values(?,?,?,?,?,?,?,?,?)";
        $db->execute(
            $sql,      $newsgroup_id, $article_id, $title,
            $reply_to, $reply_rev,    $user_id,    $disp_name,
            $ip,       $content
        );
        $db->commit;
        $self->render( json => { result => 'ok', article_id => $article_id } );
    };
    $self->render( text => $@, status => '400' ) if $@;
}

sub membership ($self) {
    my $db = NnsBbs::Db::new($self);
    my $ah = $db->select_hh( "select * from membership order by id", 'id' );
    $self->render( json => $ah );
}

sub attachment($self) {
    my $newsgroup_id = $self->param('newsgroup_id');
    my $article_id   = $self->param('article_id');
    my $rev          = $self->param('rev') || 0;
    my $cmt_json     = $self->param('comments') || '';
    my $files        = $self->req->every_upload('file');

    eval {
        die "no newsgroup_id\n" unless $newsgroup_id;
        die "no article_id\n"   unless $article_id;
        my $comment = $cmt_json ? from_json($cmt_json) : undef;
        my $db      = NnsBbs::Db::new($self);
        my ( $level, $moderator, $admin, $user_id ) =
          access_level( $self, $db );
        my ($wpl) = $db->select_ra( "select wpl from newsgroup where id=?",
            $newsgroup_id );
        die "no write permission" if ( !$moderator && $level < $wpl );

        my ( $id, $sql );
        my $ord = 0;
        for my $file (@$files) {
            while (1) {
                $id  = random_id(12);
                $sql = "select count(*) from attached_file where id=?";
                my ($c) = $db->select_ra( $sql, $id );
                last if $c == 0;
            }
            $sql = "insert into attached_file";
            $sql .= "(id,filename,content_type,user_id,data)";
            $sql .= "values(?,?,?,?,?)";
            $db->execute( $sql, $id, $file->filename,
                $file->headers->content_type,
                $user_id, $file->slurp );
            my $cmt = "";
            $cmt = $comment->[$ord] if ($comment);

            $sql = "insert into attachment";
            $sql .= "(newsgroup_id,article_id,rev,file_id,ord,comment)";
            $sql .= "values(?,?,?,?,?,?)";
            $db->execute( $sql, $newsgroup_id, $article_id, $rev, $id, $ord++,
                $cmt );
        }
        $db->commit;
        $self->render( json => { result => 'ok' } );
    };
    $self->render( text => $@, status => '400' ) if $@;
}

1;
