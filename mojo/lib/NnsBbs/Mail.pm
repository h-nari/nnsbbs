package NnsBbs::Mail;

use utf8;
use Encode;
use strict;
use warnings;
use Authen::SASL;
use MIME::Base64;
use Net::SMTP;

my $SMTP_CONF = {
    host        => 'localhost',
    port        => 25,
    from        => 'nnsbbs@humblesoft.com',
    return_path => 'nnsbbs@humblesoft.com',
};

sub send {
    my $conf         = shift;
    my $to_addr      = shift;
    my $subject_orig = shift;
    my $content_orig = shift;
 
    my $from = encode('utf-8', $conf->{FROM} || $SMTP_CONF->{from}) ;
    my $return_path = $conf->{RETURN_PATH} || $SMTP_CONF->{return_path};

    my $subject = Encode::encode( 'MIME-Header-ISO_2022_JP', $subject_orig );
    my @header  = (
        "From: $from",
        "Return-path: $return_path",
        "Replay-To: $return_path",
        "To: $to_addr",
        "Subject: $subject",
        "Mime-Version: 1.0",
        'Content-Type: text/plain; charset = "ISO-20220JP"',
        'Content-Transfer-Encoding: 7bit',
    );
    my $header  = join( "\n", @header ) . "\n";
    my $content = encode( 'iso-2022-jp', $content_orig );
    my $smtp    = Net::SMTP->new(
        $SMTP_CONF->{host},
        Hello   => $SMTP_CONF->{host},
        Port    => $SMTP_CONF->{port},
        Timeout => 20
    );
    $smtp || die "can't connect smtp server: $!";
    $smtp->mail( $SMTP_CONF->{from} );
    $smtp->to($to_addr);
    $smtp->data();
    $smtp->datasend("$header\n");
    $smtp->datasend("$content\n");
    $smtp->dataend();
    $smtp->quit;
}

1;
