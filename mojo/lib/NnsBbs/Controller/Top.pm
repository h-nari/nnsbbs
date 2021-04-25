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

    $self->stash(
        script_part =>
"<script>\$(()=>{nnsbbs.top_page(\"$newsgroup\",\"$article_id\");});</script>",
        msg => "Welcome to nnsbbs: NetNews styled BBS!"
    );
    $self->render( template => 'top/show' );
}

1;
