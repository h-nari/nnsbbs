package NnsBbs::CLI::notify;
use Mojo::Base 'Mojolicious::Command';
use Mojo::JSON qw(decode_json encode_json);
use Getopt::Long qw(GetOptionsFromArray :config no_auto_abbrev no_ignore_case);
use NnsBbs::Db;
use NnsBbs::Mail;
use NnsBbs::ReadSet;
use NnsBbs::Util qw(tag);
use Data::Dumper;
use Encode;
has description => "send notify mails\n";

has usage => <<EOF;
usage: $0 [options] [hh]

hh: 0-23 , hour send mail

options:
    -n  not send mails, but show them
    -f  send mails regardless of the time
EOF

sub run {

    my ( $self, @args ) = @_;
    GetOptionsFromArray(
        \@args,
        'n' => \( my $no_send ),
        'f' => \( my $force )
    ) or die $self->usage;

    die "too many argments\n" . $self->usage if ( $#args > 0 );
    my $hh;
    if ( $#args == 0 ) {
        $hh = $args[0];
        die "bad number $hh\n" . $self->usage unless ( $hh =~ /^\d+$/ );
        die "number $hh out of range\n", $self->usage
          unless $hh >= 0 && $hh <= 23;
    }
    else {
        my @t = localtime;
        $hh = $t[2];
    }
    print "hh=$hh\n";

    my $app      = $self->app;
    my $db       = NnsBbs::Db::new($app);
    my $url_base = $app->config->{TOP_URL};
    my $ctlr     = $app->build_controller;
    $ctlr->languages('jp');

    # 各掲示板の投稿状況取得

    my $sql = "select id,name,max_id from newsgroup";
    $sql .= " where not bDeleted";
    $sql .= " order by ord";
    my $ng_list = $db->select_aa($sql);

    # TODO:: deleted_articleの情報取得

    # ユーザ毎の処理

    $sql = "select id,mail,setting from user";
    my $aa = $db->select_aa($sql);
    for my $ar (@$aa) {

        my ( $user_id, $mail, $setting ) = @$ar;
        if ($setting) {
            my $d = decode_json $setting;
            if ( $d->{notifyPost} && ( $force || $d->{notifyPostAt} == $hh ) ) {
                print "notify\n";

                # 購読情報を取得

                $sql = "select newsgroup_id as nid,done from subsInfo";
                $sql .= " where user_id=? and subscribe";
                my $subs = $db->select_hh( $sql, 'nid', $user_id );
                my ( $n, $c ) =
                  &make_notify_content( $ng_list, $subs, $url_base );
                if ( $n > 0 ) {
                    my $to = $mail;
                    my $subject =
                      $ctlr->l( 'notify.mail.subject', $n,
                        $app->config->{NAME} );
                    my $content = $ctlr->l('notify.mail.preamble', $app->config->{NAME});
                    $content .= $c;
                    $content .= $ctlr->l('notify.mail.postamble',$app->config->{TOP_URL});
                    if ($no_send) {
                        print "TO:$to\n";
                        print encode( 'utf-8', "SUBJECT: $subject\n" );
                        print encode( 'utf-8', "CONTENT:\n$content\n" );
                    }
                    else {
                        Nnsbbs::Mail::send( $app->config->{MAIL},
                            $to, $subject, $content );
                    }
                }
            }
        }
    }
}

sub make_notify_content {
    my ( $ng_list, $subs, $url_base ) = @_;
    my $content = "";
    my $n       = 0;
    for my $ng (@$ng_list) {
        my ( $nid, $name, $max_id ) = @$ng;
        my $si = $subs->{$nid};
        if ($si) {
            my $done   = $si->{done};
            my $rs     = NnsBbs::ReadSet->new($done);
            my $unread = $max_id - $rs->count;
            if ( $unread > 0 ) {
                $n += $unread;
                $content .= "  $name [$unread]\n";
                $content .= "    ${url_base}bbs/$name\n";
            }
        }
    }
    return ( $n, $content );
}

1;
