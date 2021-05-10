package NnsBbs::Controller::Top;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Db;
use Data::Dumper;

sub show ($self) {
    $self->redirect_to('/bbs');
}

sub bbs ($self) {
    my $db         = NnsBbs::Db::new($self);
    my $newsgroup  = $self->param('newsgroup') || "";
    my $article_id = $self->param('article_id') || "";

    my $s = "<script>\n";
    $s .= "\$(()=>{\n";
    $s .= sprintf( '  nnsbbs.top_page("%s","%s");', $newsgroup, $article_id )
      . "\n";
    $s .= "});\n";
    $s .= "</script>\n";

    $self->stash( script_part => $s );
    $self->render( template => 'top/show' );
}

sub attachment ($self) {
    my $id = $self->param('id');

    eval {
        die "no id\n" unless ($id);
        my $db = NnsBbs::Db::new($self);
        my $sql =
          "select filename,content_type,data from attached_file where id=?";
        my ( $filename, $type, $data ) = $db->select_ra( $sql, $id );
        die "no data found\n" unless ($filename);
        my $hdrs = $self->res->headers;

        # $hdrs->content_disposition("attachement;filename=$filename");
        $hdrs->content_disposition("filename=$filename");
        $hdrs->content_type($type);
        $self->render( data => $data );
    };
    $self->render( text => $@, status => '400' ) if $@;
}

1;
