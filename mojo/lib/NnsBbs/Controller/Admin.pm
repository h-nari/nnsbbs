package NnsBbs::Controller::Admin;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Util qw/access_level/;
use JSON;
use NnsBbs::Db;
use Data::Dumper;
use utf8;

sub user_list ($self) {
    my $db = NnsBbs::Db::new($self);
    my ( $level, $moderator ) = access_level( $self, $db );
    if ($moderator) {
        my $s = "<script>\n";
        $s .= "\$(()=>{\n";
        $s .= "var ua = window.nnsbbs.userAdmin;\n";
        $s .= "\$('#main').html(ua.html());\n";
        $s .= "ua.redisplay(true);\n";
        $s .= " });\n";
        $s .= "</script>\n";
        $self->stash(
            script_part => $s,
            page_title  => $self->l('user.management')
        );
        $self->render( template => 'admin/show' );
    }
    else {
        $self->render( text => 'Access Forbidden', status => '403' );
    }
}

sub user ($self) {
    my $db = NnsBbs::Db::new($self);
    my ( $level, $moderator ) = access_level( $self, $db );
    if ($moderator) {
        my $id = $self->param('id');
        my $s  = "<script>\n";
        $s .= "\$(()=>{\n";
        $s .= "var ui = window.nnsbbs.userInfo;\n";
        $s .= "\$('#main').html(ui.html());\n";
        $s .= "ui.setUserId('$id');\n";
        $s .= "ui.redisplay(true);\n";
        $s .= " });\n";
        $s .= "</script>\n";
        $self->stash(
            script_part => $s,
            page_title  => $self->l('user.infomation')
        );
        $self->render( template => 'admin/show' );
    }
    else {
        $self->render( text => 'Access Forbidden', status => '403' );
    }

}

sub newsgroup($self) {
    my $db = NnsBbs::Db::new($self);

    my ( $level, $moderator ) = access_level( $self, $db );
    if ($moderator) {
        my $s = "<script>\n";
        $s .= "\$(()=>{\n";
        $s .= "var na = window.nnsbbs.newsgroupAdmin;\n";
        $s .= "\$('#main').html(na.html());\n";
        $s .= "na.redisplay(true);";
        $s .= " });\n";
        $s .= "</script>\n";
        $self->stash(
            script_part => $s,
            page_title  => $self->l('newsgroup.management')
        );
        $self->render( template => 'admin/show' );
    }
    else {
        $self->render( text => 'Access Forbidden', status => '403' );
    }
}

sub api_newsgroup($self) {
    my $insert = $self->param('insert');
    my $update = $self->param('update');
    my $delete = $self->param('delete');
    my $db     = NnsBbs::Db::new($self);
    my ( $level, $moderator ) = access_level( $self, $db );

    unless ($moderator) {
        $self->render( text => 'Access Forbidden', status => '403' );
    }

    my $sql;
    if ($insert) {
        my $list = from_json($insert);
        my $cnt  = 0;
        for my $n (@$list) {
            eval { $cnt += insert_newsgroup( $db, $n ); };
            if ($@) {
                $self->render( text => $@, status => '400' );
                return;
            }
        }
        $db->commit;
        $self->render( json => { result => 'ok', executed_insert => $cnt } );
    }
    elsif ($update) {
        my $list = from_json($update);
        my $cnt  = 0;
        for my $n (@$list) {
            eval { $cnt += update_newsgroup( $db, $n ); };
            if ($@) {
                $self->render( text => $@, status => '400' );
                return;
            }
        }
        $db->commit;
        $self->render( json => { result => 'ok', executed_update => $cnt } );
    }
    elsif ($delete) {
        my $list = from_json($delete);
        for my $n (@$list) {
            if ( $n->{'id'} ) {
                $db->execute( "delete from newsgroup where id=?", $n->{'id'} );
            }
        }
        $db->commit;
        $self->render( json => { result => 'ok' } );
    }
    else {
        $sql = "select * from newsgroup";
        $sql .= " order by ord,name";
        my $data = $db->select_ah($sql);
        $self->render( json => $data );
    }
}

sub insert_newsgroup ( $db, $n ) {
    my $name = $n->{'name'};
    die "name not defined\n" unless ($name);
    my $sql = 'select count(*) from newsgroup where name=?';
    my ($count) = $db->select_ra( $sql, $name );
    die "$name is already exists\n" if $count > 0;
    my @keys   = ();
    my @values = ();
    my @places = ();

    while ( my ( $key, $value ) = each(%$n) ) {
        push( @keys,   $key );
        push( @values, $value );
        push( @places, '?' );
    }
    $sql = 'insert into newsgroup(' . join( ',', @keys ) . ')';
    $sql .= 'values(' . join( ',', @places ) . ')';
    $db->execute( $sql, @values );
}

sub update_newsgroup ( $db, $n ) {
    my $cnt = 0;
    die "id not specified in newsgroup write\n" unless ( $n->{'id'} );
    my $id = $n->{'id'};
    while ( my ( $key, $value ) = each(%$n) ) {
        my $sql = "update newsgroup set $key=? where id=?";
        $db->execute( $sql, $value, $id ) if $key ne 'id';
        $cnt++;
    }
    return $cnt;
}

sub api_user($self) {
    my $update = $self->param('update');
    my $db     = NnsBbs::Db::new($self);
    my ( $level, $moderator ) = access_level( $self, $db );
    my $id = $self->param('id');

    if ( !$moderator ) {
        $self->render( text => 'Access Forbidden', status => '403' );
    }

    if ($update) {
        my $list = from_json($update);
        my $cnt  = 0;
        for my $n (@$list) {
            eval { $cnt += update_user( $db, $n ); };
            if ($@) {
                $self->render( text => $@, status => '400' );
                return;
            }
        }
        $db->commit;
        $self->render( json => { result => 'ok', executed_update => $cnt } );
    }
    else {
        my $limit  = $self->param('limit');
        my $offset = $self->param('offset');
        my $search = $self->param('search');
        my $count  = $self->param('count');
        my $order  = $self->param('order');
        my $sql    = "select";
        my @param  = ();
        $sql .= $count ? " count(*) as count" : " *";
        $sql .= " from user";

        if ($id) {
            $sql .= " where id=?";
            push( @param, $id );
        }
        elsif ($search) {
            my $pat = '%' . $search . '%';
            $sql .= " where disp_name like ? or mail like ? ";
            $sql .= " or id like ? or profile like ?";
            push( @param, $pat, $pat, $pat, $pat );
        }

        if ($order) {
            $sql .= " order by $order";
        }
        else {
            $sql .= " order by created_at";
        }
        if ($limit) {
            $sql .= " limit ?";
            push( @param, $limit );
            if ($offset) {
                $sql .= " offset ?";
                push( @param, $offset );
            }
        }
        my $data;
        if ($count) {
            $data = $db->select_rh( $sql, @param );
        }
        elsif ($id) {
            $data = $db->select_rh( $sql, @param );
        }
        else {
            $data = $db->select_ah( $sql, @param );
        }
        $self->render( json => $data );
    }
}

sub update_user ( $db, $n ) {
    my $cnt = 0;
    die "id not specified in newsgroup write\n" unless ( $n->{'id'} );
    my $id = $n->{'id'};
    while ( my ( $key, $value ) = each(%$n) ) {
        my $sql = "update user set $key=? where id=?";
        $db->execute( $sql, $value, $id ) if $key ne 'id';
        $cnt++;
    }
    return $cnt;
}

sub api_title($self) {
    my $user_id = $self->param('user_id');
    my $data    = "";
    my $db      = NnsBbs::Db::new($self);
    my ( $level, $moderator ) = access_level( $self, $db );

    unless ($moderator) {
        $self->render( text => 'Access Forbidden', status => '403' );
    }

    eval {
        die "user_id is required" if ( !$user_id );

        my $sql = "select newsgroup_id,id,title,reply_to";
        $sql .= ",user_id,disp_name,ip,bDeleted,created_at,deleted_at";
        $sql .= " from article where user_id=? order by created_at";
        $data = $db->select_ah( $sql, $user_id );
    };
    if ($@) {
        $self->render( text => $@, status => '400' );
    }
    else {
        $self->render( json => $data );
    }
}

sub report ($self) {
    my $db = NnsBbs::Db::new($self);
    my ( $level, $moderator ) = access_level( $self, $db );
    if ($moderator) {
        my $id = $self->param('id');
        my $s  = "<script>\n";
        $s .= "\$(()=>{\n";
        if ( defined($id) ) {
            $s .= "  var rp = window.nnsbbs.reportPage;\n";
            $s .= "  \$('#main').html(rp.html());\n";
            $s .= "  rp.bind();\n";
            $s .= "  rp.open($id);\n";
        }
        else {
            $s .= "  var rm = window.nnsbbs.reportManager;\n";
            $s .= "  \$('#main').html(rm.html());\n";
            $s .= "  rm.bind();\n";
            $s .= "  rm.open();\n";
        }
        $s .= "});\n";
        $s .= "</script>\n";
        $self->stash(
            script_part => $s,
            page_title  => $self->l('report.manager')
        );
        $self->render( template => 'admin/show' );
    }
    else {
        $self->render( text => 'Access Forbidden', status => '403' );
    }
}

sub api_report($self) {
    my $update = $self->param('update');
    my $db     = NnsBbs::Db::new($self);
    my ( $level, $moderator ) = access_level( $self, $db );

    unless ($moderator) {
        $self->render( text => 'Access Forbidden', status => '403' );
    }

    if ($update) {
        my $n   = from_json($update);
        my $cnt = 0;
        eval { $cnt += update_report( $db, $n ); };
        if ($@) {
            $self->render( text => $@, status => '400' );
            return;
        }
        $db->commit;
        $self->render( json => { result => 'ok', executed_update => $cnt } );
    }
    else {
        my $limit      = $self->param('limit');
        my $offset     = $self->param('offset');
        my $search     = $self->param('search');
        my $count      = $self->param('count');
        my $order      = $self->param('order');
        my $id         = $self->param('id');
        my $treatments = $self->every_param('treatments[]');
        my $types      = $self->every_param('types[]');
        my $sql        = "select";
        my @param      = ();

        if ($count) {
            $sql .= " count(*) as count";
        }
        else {
            $sql .= " r.id as id,type_id,treatment_id";
            $sql .= ",t.name as type,m.name as treatment";
            $sql .= ",n.name as newsgroup,a.id as article_id";
            $sql .= ",title,disp_name";
            $sql .= ",a.created_at as posted_at";
            $sql .= ",notifier,detail,treatment_detail";
            $sql .= ",r.created_at as created_at,treated_at";
        }
        $sql .= " from report as r";
        $sql .= ",newsgroup as n";
        $sql .= ",article as a";
        $sql .= ",report_type as t";
        $sql .= ",report_treatment as m";
        $sql .= " where r.newsgroup_id=n.id";
        $sql .= " and r.newsgroup_id=a.newsgroup_id";
        $sql .= " and r.article_id=a.id";
        $sql .= " and r.type_id=t.id";
        $sql .= " and r.treatment_id=m.id";

        if ($id) {
            $sql .= " and r.id=?";
            push( @param, $id );
        }
        elsif ($search) {
            my $pat = '%' . $search . '%';
            $sql .= " and detail like ? or treatment_detail like ? ";
            push( @param, $pat, $pat );
        }

        if ( $types && @$types > 0 ) {
            $sql .= ' and (';
            $sql .= join( ' or ', map { "r.type_id=?" } @$types );
            $sql .= ')';
            push( @param, @$types );
        }
        if ( $treatments && @$treatments > 0 ) {
            $sql .= ' and (';
            $sql .= join( ' or ', map { "r.treatment_id=?" } @$treatments );
            $sql .= ')';
            push( @param, @$treatments );
        }

        if ($order) {
            $sql .= " order by $order";
        }
        else {
            $sql .= " order by r.created_at";
        }
        if ($limit) {
            $sql .= " limit ?";
            push( @param, $limit );
            if ($offset) {
                $sql .= " offset ?";
                push( @param, $offset );
            }
        }

        # print STDERR "*** SQL:$sql\n\n";

        my $data;
        if ($count) {
            $data = $db->select_rh( $sql, @param );
        }
        elsif ($id) {
            $data = $db->select_rh( $sql, @param );
        }
        else {
            $data = $db->select_ah( $sql, @param );
        }
        $self->render( json => $data );
    }
}

sub update_report ( $db, $n ) {
    my $cnt = 0;
    die "id not specified in newsgroup write\n" unless ( $n->{'id'} );
    my $id = $n->{'id'};
    while ( my ( $key, $value ) = each(%$n) ) {
        my $sql = "update report set $key=?,treated_at=now() where id=?";
        $db->execute( $sql, $value, $id ) if $key ne 'id';
        $cnt++;
    }
    return $cnt;
}

sub api_article($self) {
    my $update = $self->param('update');
    my $db     = NnsBbs::Db::new($self);
    my ( $level, $moderator ) = access_level( $self, $db );

    eval {
        die "access forbidden" unless ($moderator);
        if ($update) {
            my $arg = from_json($update);
            my $id  = $arg->{'id'};
            die "id required" unless $id;
            my $cnt = 0;
            while ( my ( $key, $value ) = each(%$arg) ) {
                next if ( $key eq 'id');
                my $sql = "update article set $key=?";
                $sql .= ",deleted_at=now()" if ( $key eq "bDeleted" );
                $sql .= " where id=?";
                $db->execute( $sql, $value, $id);
                $cnt++;
            }
            die "no parameter specified" if $cnt == 0;
            $db->commit;
            $self->render( json => { result => 'ok' } );
        }
        else {
            die "no command";
        }
    };
    $self->render( text => $@, status => '400' ) if $@;
}
1;
