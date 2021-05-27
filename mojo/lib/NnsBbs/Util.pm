package NnsBbs::Util;
use NnsBbs::Controller::Auth;
use String::Random;

use Exporter 'import';
our @EXPORT_OK = qw/access_level get_theme random_id/;

sub access_level {
    my $c  = shift;    # Mojo::Controller
    my $db = shift;

    my $session_id = $c->session('id');
    return ( 0, 0, 0 ) unless $session_id;
    NnsBbs::Controller::Auth::update_session($db);
    my $sql = "select u.membership_id, moderator, admin, u.id";
    $sql .= " from user as u,session as s";
    $sql .= " where u.id = s.user_id and s.id=?";
    my ( $level, $moderator, $admin, $user_id ) =
      $db->select_ra( $sql, $session_id );
    $sql = "update session set last_access=now() where id=?";
    $db->execute( $sql, $session_id );
    $db->commit;

    $c->session( id => $session_id, expiration => 3600 * 24 * 7 );

    return ( $level, $moderator, $admin, $user_id ) if ( defined($level) );
    return ( 0,      0,          0,      0 );
}

sub get_theme {
    my $c          = shift;
    my $db         = NnsBbs::Db::new($c);
    my $session_id = $c->session('id');
    return '00-default' unless $session_id;
    my $sql = "select theme";
    $sql .= " from user as u,session as s";
    $sql .= " where u.id=s.user_id and s.id=?";
    my ($theme) = $db->select_ra( $sql, $session_id ) || '00-default';
    return $c->url_for( '/theme/theme-' . $theme . '.css' );
}

sub random_id {
    my $length = shift || 12;
    return String::Random->new->randregex("[A-Za-z0-9]{$length}");
}
1;
