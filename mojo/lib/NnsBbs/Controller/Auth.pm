package NnsBbs::Controller::Auth;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Db;
use Data::Dumper;

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

    if ( !$disp_name ) {
        push( @errors, "表示名が入力されていません" );
    }
    if ( !$pwd1 ) {
        push( @errors, "パスワードが入力されていません" );
    }
    elsif ( length($pwd1) < 8 ) {
        push( @errors,
"パスワードが短すぎます。8文字以上にしてください"
        );
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
        $self->render( template => 'auth/user_registered' );
    }
}

1;
