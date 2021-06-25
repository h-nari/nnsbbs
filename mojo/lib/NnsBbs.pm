package NnsBbs;
use NnsBbs::Util qw/get_theme/;
use Mojo::Base 'Mojolicious', -signatures;
use Data::Dumper;

# This method will run once at server start
sub startup ($self) {
    my $config = $self->plugin('NotYAMLConfig');
    $self->secrets( $config->{secrets} );
    $self->_load_config();

    $self->plugin('ClientIP');
    $self->plugin(
        'I18N',
        {
            namespace        => 'NnsBbs::I18N',
            no_header_detect => 1,
            default          => 'jp'
        }
    );
    $self->helper(
        theme => sub {
            my $c = shift;
            return get_theme($c);
        },
        l => sub {
            my $c      = shift;
            my $str_id = shift;
            return $c->l($str_id);
        }
    );
    my $ver = `/usr/bin/git describe`;
    chop($ver);
    $self->{npm_version} = $ver;

    # Router
    my $r = $self->routes;

    $r->get('/index.html')->to('top#show');
    $r->get('/')->to('top#show');
    $r->get('/mail_auth/#id')->to('auth#mail_auth');
    $r->post('/register')->to('auth#register');
    $r->get('/bbs')->to('top#bbs');
    $r->get('/bbs/#newsgroup')->to('top#bbs');
    $r->get('/bbs/#newsgroup/#id')->to('top#bbs');
    $r->get('/attachment/#id')->to('top#attachment');

    $r->get('/admin/user')->to('admin#user_list');
    $r->get('/admin/user/#id')->to('admin#user');
    $r->get('/admin/newsgroup')->to('admin#newsgroup');
    $r->get('/admin/report')->to('admin#report');
    $r->get('/admin/report/#id')->to('admin#report');

    $r->any('/api/newsgroup')->to('api#newsgroup');
    $r->any('/api/titles')->to('api#titles');
    $r->any('/api/article')->to('api#article');
    $r->any('/api/mail_auth')->to('api#mail_auth');
    $r->any('/api/membership')->to('api#membership');
    $r->any('/api/theme')->to('api#theme');
    $r->any('/api/user')->to('api#user');
    $r->any('/api/login')->to('auth#api_login');
    $r->any('/api/logout')->to('auth#api_logout');
    $r->any('/api/session')->to('auth#api_session');
    $r->any('/api/profile_read')->to('api#profile_read');
    $r->post('/api/profile_write')->to('api#profile_write');
    $r->post('/api/post')->to('api#post_article');
    $r->any('/api/subsInfo')->to('api#subsInfo');
    $r->any('/api/attachment')->to('api#attachment');
    $r->any('/api/reaction')->to('api#reaction');
    $r->any('/api/reaction_type')->to('api#reaction_type');
    $r->any('/api/report')->to('api#report');
    $r->any('/api/report_type')->to('api#report_type');
    $r->any('/api/report_treatment')->to('api#report_treatment');

    $r->any('/admin/api/article')->to('admin#api_article');
    $r->any('/admin/api/newsgroup')->to('admin#api_newsgroup');
    $r->any('/admin/api/user')->to('admin#api_user');
    $r->any('/admin/api/title')->to('admin#api_title');
    $r->any('/admin/api/report')->to('admin#api_report');
    $r->any('/admin/api/db_check')->to('database#api_check');
    $r->any('/admin/api/db_repair')->to('database#api_repair');
}

sub _load_config {
    my $self = shift;
    my $f;

    my $env_db = $ENV{'NNSBBS_DB'} || "";

    if ( $env_db eq 'fj' ) {
        $f = $self->home->to_string . "/etc/fj-db.conf";
    }
    else {
        $f = $self->home->to_string . "/etc/db.conf";
    }
    if ( -f $f ) {
        print STDERR "*** exists: $f \n";
        $self->plugin( 'Config', { 'file' => $f } );
    }
    else {
        print STDERR "*** not exists: $f\n";
    }
}

1;
