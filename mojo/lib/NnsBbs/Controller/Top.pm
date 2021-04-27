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

    my $s = '<script src="/app.js"></script>' . "\n";
    $s .= "<script>\n";
    $s .= "\$(()=>{\n";
    $s .= sprintf( '  nnsbbs.top_page("%s","%s");', $newsgroup, $article_id )
      . "\n";
    $s .= "});\n";
    $s .= "</script>\n";

    $self->stash( script_part => $s);
    $self->render( template => 'top/show' );
}

1;
