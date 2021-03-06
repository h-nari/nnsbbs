
package NnsBbs::Controller::Top;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Db;
use NnsBbs::Util qw/access_level get_theme/;
use JSON;
use Data::Dumper;

sub show ($self) {
    my $db = NnsBbs::Db::new($self);

    my $s = "<script>\n";
    $s .= "var init_data = " . to_json( $db->init_data($self) ) . "\n";
    $s .= "console.log('init_data:', init_data);\n";
    $s .= "</script>\n";
    $self->stash(
        title       => $self->app->config->{NAME},
        script_part => $s
    );
    $self->render_maybe('top/index') or $self->redirect_to('/bbs');
}

sub bbs ($self) {
    my $ua = $self->tx->req->headers->user_agent;
    print "*** UA:$ua\n";
    if ( $ua =~ /MSIE|Trident/i ) {
        $self->stash(
            title => $self->app->config->{NAME},
            script_part => ''
        );
        $self->render( template => 'top/no_ie' );
    }
    else {
        my $newsgroup = $self->param('newsgroup') || "";
        my $id        = $self->param('id')        || "";
        my $db        = NnsBbs::Db::new($self);

        my $s = "<script>\n";
        $s .= "\$(()=>{\n";
        $s .=
          sprintf( '  nnsbbs.top_page("%s","%s");', $newsgroup, $id ) . "\n";
        $s .= "});\n";
        $s .= "var init_data = " . to_json( $db->init_data($self) ) . "\n";
        $s .= "console.log('init_data:', init_data);\n";
        $s .= "</script>\n";

        $self->stash(
            title       => $self->app->config->{NAME},
            script_part => $s
        );
        $self->render( template => 'top/show' );
    }
}

sub attachment ($self) {
    my $id = $self->param('id');
    eval {
        die "no id\n" unless ($id);
        my $db = NnsBbs::Db::new($self);
        my ( $level, $moderator ) = access_level( $self, $db );
        my $sql = "select min(rpl) from newsgroup as n,attachment as a";
        $sql .= " where n.id=a.newsgroup_id and a.file_id=?";
        my ($rpl) = $db->select_ra( $sql, $id );
        die "You do not have read permission.\n"
          if ( $rpl > $level && !$moderator );
        $sql = "select filename,content_type,data";
        $sql .= " from attached_file where id=?";
        my ( $filename, $type, $data ) = $db->select_ra( $sql, $id );
        die "no data found\n" unless ($filename);
        my $hdrs = $self->res->headers;

        $hdrs->content_disposition("filename=$filename");
        $hdrs->content_type($type);
        $self->render( data => $data );
    };
    $self->render( text => $@, status => '400' ) if $@;
}

1;
