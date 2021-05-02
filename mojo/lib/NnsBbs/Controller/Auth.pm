package NnsBbs::Controller::Auth;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Db;
use Data::Dumper;
use String::Random;
use Digest::SHA1 qw(sha1_hex);

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
            title       => "メール認証に成功しました",
            msg =>
              "下記に入力し、ユーザ登録を完了させて下さい",
            email     => '',
            disp_name => '',
            pwd1      => '',
            pwd2      => ''
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
    print STDERR "*** email:$email db_email:$db_email\n";
    if ( !$db_email ) {
        push( @errors, "idが正しくありません" );
    }
    elsif ( $db_email ne $email ) {
        push( @errors,
            "メールアドレスが認証に使用したものと違います"
        );
    }
    else {
        $sql = "select count(*) from user where mail=?";
        my ($cnt) = $db->select_ra( $sql, $email );
        if ( $cnt > 0 ) {
            push( @errors,
"メールアドレスが既に使用されています(内部エラー)"
            );
        }
    }

    if ( !$disp_name ) {
        push( @errors, "表示名が入力されていません" );
    }
    if ( !$pwd1 ) {
        push( @errors, "パスワードが入力されていません" );
    }
    elsif ( length($pwd1) < 8 ) {
        push( @errors,
                "パスワードが短すぎます。"
              . "8文字以上にしてください" );
    }
    elsif ( $pwd1 ne $pwd2 ) {
        push( @errors, "確認用パスワードが一致しません" );
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
            title       => "登録情報にエラーがあります",
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
            $user_id = String::Random->new->randregex('[A-Za-z0-9]{12}');
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
        my $sql = "select id,disp_name from user";
        $sql .= " where mail=? and password=?";
        my ( $user_id, $disp_name ) = $db->select_ra( $sql, $email, $pwd );
        if ( !$user_id ) {
            $self->render( json => { login => 0 } );
        }
        else {
            &new_session( $self, $db, $user_id );
            $self->render( json => { login => 1 } );
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
    print STDERR "*** api_session: session_id:$session_id\n";
    if ($session_id) {
        my $db = NnsBbs::Db::new($self);
        &update_session($db);
        my $sql =
          "select disp_name, u.id as user_id from user as u,session as s";
        $sql .= " where u.id = s.user_id and s.id=?";
        my ( $disp_name, $user_id ) = $db->select_ra( $sql, $session_id );
        if ($disp_name) {
            $self->render(
                json => { login => 1, name => $disp_name, user_id => $user_id }
            );
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
