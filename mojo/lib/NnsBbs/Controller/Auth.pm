package NnsBbs::Controller::Auth;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Db;
use Data::Dumper;
use String::Random;
use Digest::SHA1 qw(sha1_hex);
use NnsBbs::Util qw(random_id);

sub mail($self) {
    my $id = $self->param('id');

    if ( !$id ) {
        $self->render( text => "bad URL", status => '400' );
        return;
    }
    my $db  = NnsBbs::Db::new($self);
    my $sql = "select email from mail_auth where id=?";
    my $ah  = $db->select_ah( $sql, $id );
    my $len = @$ah + 0;
    if ( $len == 0 ) {
        $self->stash( script_part => '' );
        $self->render( template => 'auth/no_id' );
    }
    elsif ( $len == 1 ) {
        $db->execute( "delete from mail_auth where id=?", $id );
        $db->commit;
        $self->stash(
            script_part => '',
            id          => $id,
            title       => $self->l('Email.verification.successful'),
            msg         => $self->l('fill.in.form'),
            email       => '',
            disp_name   => '',
            pwd1        => '',
            pwd2        => ''
        );
        $self->render( template => 'auth/register' );
    }
    else {
        $self->render( text => 'too many record found', status => '400' );
    }

}

# User register
sub register($self) {
    my $id        = $self->param('auth-id');
    my $email     = $self->param('email');
    my $disp_name = $self->param('disp_name');
    my $pwd1      = $self->param('password1');
    my $pwd2      = $self->param('password2');

    # check parameters
    my $db     = NnsBbs::Db::new($self);
    my @errors = ();

    my $sql = "select email from mail_auth where id=?";
    my ($db_email) = $db->select_ra( $sql, $id );
    if ( !$db_email ) {
        push( @errors, $self->l('id.is.not.correct') );
    }
    elsif ( $db_email ne $email ) {
        push( @errors, $self->l('email.is.not.same') );
    }
    else {
        $sql = "select count(*) from user where mail=?";
        my ($cnt) = $db->select_ra( $sql, $email );
        if ( $cnt > 0 ) {
            push( @errors, $self->l('email.is.already.used') );
        }
    }

    if ( !$disp_name ) {
        push( @errors, $self->l('disp_name.is.blank') );
    }
    if ( !$pwd1 ) {
        push( @errors, $self->l('password.is.blank') );
    }
    elsif ( length($pwd1) < 8 ) {
        push( @errors, $self->l('too.short.password') );
    }
    elsif ( $pwd1 ne $pwd2 ) {
        push( @errors, $self->l('password.is.not.same') );
    }

    if ( @errors > 0 ) {
        my $msg = "";
        for my $e (@errors) {
            $msg .= "<li>$e</li>\n";
        }
        $msg = "<div class='error'><ul>$msg</ul></div>\n";

        $self->stash(
            script_part => '',
            id          => $id,
            title       => $self->l('error.in.registration'),
            msg         => $msg,
            email       => $email,
            disp_name   => $disp_name,
            pwd1        => $pwd1,
            pwd2        => $pwd2
        );
        $self->render( template => 'auth/register' );
    }
    else {
        my $user_id;
        while (1) {
            $user_id = random_id(12);
            $sql     = "select count(*) from user where id=?";
            my ($c) = $db->select_ra( $sql, $user_id );
            last if ( $c == 0 );
        }
        my $pwd = sha1_hex($pwd1);
        $sql = "insert into user(id,mail,disp_name,password,logined_at)";
        $sql .= "values(?,?,?,?,now())";
        $db->execute( $sql, $user_id, $email, $disp_name, $pwd );
        $self->stash( script_part => '' );
        $self->render( template => 'auth/user_registered' );
        $db->commit;
    }
}

sub api_login {
    my $self  = shift;
    my $email = $self->param('email') || "";
    my $pwd   = $self->param('pwd') || "";

    if ( !$email || !$pwd ) {
        $self->render( text => 'Parameters are missing.', status => '400' );
    }
    else {
        my $db  = NnsBbs::Db::new($self);
        my $sql = "select id,disp_name,membership_id,signature,moderator,setting,theme";
        $sql .= " from user";
        $sql .= " where mail=? and password=? and not bBanned";
        my $rh = $db->select_rh( $sql, $email, $pwd );
        if ( !$rh ) {
            $self->render( json => { login => 0 } );
        }
        else {
            $db->execute( "update user set logined_at=now() where id=?",
                $rh->{'id'} );
            $db->commit;
            &new_session( $self, $db, $rh->{'id'} );
            $self->render(
                json => {
                    login => 1,
                    user  => $rh
                }
            );
        }
    }
}

sub api_logout {
    my $self       = shift;
    my $session_id = $self->session('id');
    if ($session_id) {
        my $db  = NnsBbs::Db::new($self);
        my $sql = "delete from session where id=?";
        $db->execute( $sql, $session_id );
        $db->commit;
    }
    $self->session( expires => 1 );
    $self->render( json => { login => 0 } );
}

sub api_session {
    my $self       = shift;
    my $session_id = $self->session('id') || '';

    if ($session_id) {
        my $db = NnsBbs::Db::new($self);
        &update_session($db);
        my $sql = "select disp_name, u.id as id";
        $sql .= ",membership_id,signature,moderator,theme";
        $sql .= " from user as u,session as s";
        $sql .= " where u.id = s.user_id and s.id=?";
        my $rh = $db->select_rh( $sql, $session_id );
        if ($rh) {
            $self->render( json => { login => 1, user => $rh } );
            return;
        }
    }
    $self->render( json => { login => 0 } );
}

sub new_session {
    my $self    = shift;
    my $db      = shift;
    my $user_id = shift;

    &update_session($db);
    my $sql = "select count(*) from session where id=?";
    my $id;
    while (1) {
        $id = String::Random->new->randregex('[A-Za-z0-9]{48}');
        my ($c) = $db->select_ra( $sql, $id );
        last if $c == 0;
    }
    $sql = "delete from session where user_id=?";
    $db->execute( $sql, $user_id );
    $sql = "insert into session (id,user_id) values(?,?)";
    $db->execute( $sql, $id, $user_id );
    $db->commit;
    $self->session( id => $id, expiration => 3600 * 24 * 7 );
}

# delete expired session information .
sub update_session {
    my $db  = shift;
    my $sql = "delete from session";
    $sql .= " where last_access  < subtime(now(),'24:00:00')";
    $sql .= " or created_at < subtime(now(), '24:00:00')";
    $db->execute($sql);
    $db->commit;
}

1;
