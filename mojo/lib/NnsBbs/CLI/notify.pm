package NnsBbs::CLI::notify;
use Mojo::Base 'Mojolicious::Command';
use Mojo::JSON qw(decode_json encode_json);
use Getopt::Long qw(GetOptionsFromArray :config no_auto_abbrev no_ignore_case);
use NnsBbs::Db;
use Data::Dumper;

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

    my $app = $self->app;
    my $db  = NnsBbs::Db::new($app);

    # 各掲示板の投稿状況取得

    my $sql = "select id,name,max_id from newsgroup";
    $sql .= " where not bDeleted";
    $sql .= " order by ord";
    my $ng_list = $db->select_aa($sql);

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
                my $c    = &make_notify_content( $ng_list, $subs );
            }
        }
    }
}

sub make_notify_content {
    my ( $ng_list, $subs ) = @_;
    for my $ng (@$ng_list) {
        my ( $nid, $name, $max_id ) = @$ng;
        my $si = $subs->{$nid};
        if ($si) {
            my $done = $si->{done};
            print "nid:$nid name:$name max_id:$max_id done:$done\n";
        }
    }
}

1;
