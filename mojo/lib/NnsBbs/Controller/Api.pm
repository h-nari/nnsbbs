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
        my $sql = "select id as article_id ,rev,title,reply_to";
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

        $sql = "select article_id,a.rev as rev,count(*) as count,type_id";
        $sql .= " from article as a,reaction as r";
        $sql .= " where a.newsgroup_id=r.newsgroup_id";
        $sql .= " and a.id=r.article_id and a.rev=r.rev";
        $sql .= " and a.newsgroup_id = ? and not bDeleted";
        $sql .= " group by a.id,a.rev,type_id";
        @params = ($newsgroup_id);
        if ($from) {
            $sql .= " and id >= ?";
            push @params, $from;
        }
        if ($to) {
            $sql .= "and id <= ?";
            push @params, $to;
        }
        my $ah  = $db->select_ah( $sql, @params );
        my $arh = {};
        for my $ra (@$ah) {
            my $a_id = $ra->{article_id};
            my $rev  = $ra->{rev};
            $arh->{ $a_id, $rev } = {} unless $arh->{ $a_id, $rev };
            $arh->{ $a_id, $rev }->{ $ra->{type_id} } = $ra->{count};
        }
        for my $t (@$data) {
            $t->{reaction} = $arh->{ $t->{article_id}, $t->{rev} }
              if $arh->{ $t->{article_id}, $t->{rev} };
        }
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

    my $id = random_id(12);
    $sql = "insert into mail_auth(id,email) values (?,?)";
    $db->execute( $sql, $id, $email );
    $db->commit;

    my $url = $self->url_for("/mail_auth/$id")->to_abs;
    my $c   = $self->l('access.mail_auth.link');
    $c .= "   $url\n";
    $c .= "\n";
    $c .= $self->l('ignore.if.no.idea');

    NnsBbs::Mail::send( $email, $self->l('email.title'), $c );

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
        $sql .= ",signature,mail";
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

    eval {
        die "user_id is required\n" unless ($user_id);
        die "name,profile,membership_id,signature is required\n"
          if ( !$disp_name
            && !$profile
            && !$membership_id
            && !$signature);
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

sub subsInfo($self) {
    my $user_id = $self->param('user_id');
    my $write   = $self->param('write');
    eval {
        die "user_id required\n" unless $user_id;
        my $db = NnsBbs::Db::new($self);
        my ( $level, $moderator, $admin, $user_id2 ) =
          access_level( $self, $db );
        die "no permission\n" if ( $user_id ne $user_id2 ) && !$moderator;
        if ($write) {
            my $list = from_json($write);
            my $cnt  = 0;
            for my $d (@$list) {
                my $nid       = $d->{'newsgroup_id'};
                my $subscribe = $d->{'subscribe'};
                my $done      = $d->{'done'};
                my $update    = $d->{'update'};
                die "newsgroup_id,subscribe,done must be exists in data\n"
                  if ( !defined($nid)
                    || !defined($subscribe)
                    || !defined($done) );
                if ($update) {
                    my $sql = "update subsInfo set subscribe=?,done=?";
                    $sql .= " where user_id=? and newsgroup_id=?";
                    $db->execute( $sql, $subscribe, $done, $user_id, $nid );
                }
                else {
                    my $sql = "insert into subsInfo";
                    $sql .= "(user_id,newsgroup_id,subscribe,done)";
                    $sql .= "values(?,?,?,?)";
                    $db->execute( $sql, $user_id, $nid, $subscribe, $done );
                }
                $cnt++;
            }
            $db->commit;
            $self->render( json => { result => 'ok', count => $cnt } );
        }
        else {
            my $sql = "select newsgroup_id,subscribe,done,1 as 'update'";
            $sql .= " from subsInfo where user_id=?";
            my $hh = $db->select_hh( $sql, 'newsgroup_id', $user_id );
            $self->render( json => $hh );
        }
    };
    $self->render( text => $@, status => '400' ) if $@;
}

sub reaction($self) {
    my $user_id = $self->param('user_id');
    my $n_id    = $self->param('newsgroup_id');
    my $a_id    = $self->param('article_id');
    my $rev     = $self->param('rev');
    my $type_id = $self->param('type_id');
    my $sql;
    my $db = NnsBbs::Db::new($self);
    eval {
        if ($type_id) {
            die "user_id,newsgroup_id,article_id,rev are required\n"
              if ( !defined($user_id)
                || !defined($n_id)
                || !defined($a_id)
                || !defined($rev) );
            $sql = "delete from reaction";
            $sql .= " where newsgroup_id=? and article_id=?";
            $sql .= " and rev=? and user_id=?";
            $db->execute( $sql, $n_id, $a_id, $rev, $user_id );
            if ( $type_id >= 0 ) {
                $sql = "insert into reaction(newsgroup_id,article_id,rev";
                $sql .= ",user_id,type_id)";
                $sql .= "values(?,?,?,?,?)";
                $db->execute( $sql, $n_id, $a_id, $rev, $user_id, $type_id );
            }
            $db->commit;
            $self->render( json => { result => 'ok' } );
        }
        elsif ($user_id) {
            $sql = "select type_id from reaction";
            $sql .= " where newsgroup_id=? and article_id=?";
            $sql .= " and rev=? and user_id=?";
            my ($type_id) =
              $db->select_ra( $sql, $n_id, $a_id, $rev, $user_id );
            $self->render( json => { result => 'ok', type_id => $type_id } );
        }
        else {
            $sql = "select type_id,user_id,disp_name";
            $sql .= " from reaction as r,user as u";
            $sql .= " where r.user_id=u.id";
            $sql .= " and newsgroup_id=? and article_id=? and rev=?";
            $sql .= " order by r.created_at";
            my ($type_id) = $db->select_ah( $sql, $n_id, $a_id, $rev, );
            $self->render( json => { result => 'ok', data => $type_id } );
        }
    };
    $self->render( text => $@, status => '400' ) if $@;
}

sub reaction_type($self) {
    eval {
        my $db = NnsBbs::Db::new($self);
        my $d =
          $db->select_hh( 'select id,name,icon from reaction_type', 'id' );
        $self->render( json => { result => 'ok', data => $d } );
    };
    $self->render( text => $@, status => '400' ) if $@;
}

#
# Report inappropriate posts.
#
sub report($self) {
    eval {
        my $db = NnsBbs::Db::new($self);
        my $sql;
        my $insert = $self->param('insert');
        my $update = $self->param('update');
        if ($insert) {
            my $d = from_json($insert);
            $sql = "insert into report";
            $sql .= "(type_id,newsgroup_id,article_id,rev";
            $sql .= ",notifier,detail,treatment_detail)";
            $sql .= "values(?,?,?,?,?,?,?);";
            my @param = ();

            for my $k (qw/type_id newsgroup_id article_id rev/) {
                my $dd = $d->{$k};
                die "$k not set\n" unless defined($dd);
                push( @param, $dd );
            }
            for my $k (qw/notifier detail/) {
                
                push( @param, $d->{$k} || '' );
            }
            $db->execute( $sql, @param );
            $db->commit;
            $self->render( json => { result => 'ok' } );
        }
        else {
            die "insert data is required\n";
        }
    };
    $self->render( text => $@, status => '400' ) if $@;
}

sub report_type($self) {
    eval {
        my $db = NnsBbs::Db::new($self);
        my $d = $db->select_hh( "select * from report_type order by id", 'id' );
        $self->render( json => $d );
    };
    $self->render( text => $@, status => '400' ) if $@;
}

sub report_treatment($self) {
    eval {
        my $db = NnsBbs::Db::new($self);
        my $d =
          $db->select_hh( "select * from report_treatment order by id", 'id' );
        $self->render( json => $d );
    };
    $self->render( text => $@, status => '400' ) if $@;
}

1;
