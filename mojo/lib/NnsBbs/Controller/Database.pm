package NnsBbs::Controller::Database;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Db;
use NnsBbs::Util qw/access_level/;
use Data::Dumper;

sub api_check($self) {
    eval {
        my $db = NnsBbs::Db::new($self);
        my ( $level, $moderator ) = access_level( $self, $db );
        die "no permission" unless $moderator;

        my $errors = [];

        # newsgroup max_idのチェック

        my $sql = "select newsgroup_id,max(id) as max_id from article";
        $sql .= " group by newsgroup_id";
        $db->execute("lock tables newsgroup read, article read");
        my $hh1 = $db->select_hh( $sql, 'newsgroup_id' );

        $sql = "select id,name,max_id,ord from newsgroup";
        my $hh2 = $db->select_hh( $sql, 'id' );
        $db->execute("unlock tables");
        for my $id (
            sort { $hh2->{$a}->{ord} <=> $hh2->{$b}->{ord} }
            keys %$hh2
          )
        {
            my $v           = $hh2->{$id};
            my $true        = $hh1->{$id};
            my $true_max_id = $true->{max_id} || 0;
            if ( $v->{max_id} != $true_max_id ) {
                push(
                    @$errors,
                    {
                        type    => 'max_id error',
                        message => sprintf(
'max_id error: max_id of newsgroup "%s" is %d, should be %d',
                            $v->{name}, $v->{max_id}, $true_max_id
                        )
                    }
                );
            }
        }
        $self->render(
            json => { error_count => @$errors + 0, errors => $errors } );
    };
    $self->render( text => $@, status => '400' ) if $@;
}

sub api_repair($self) {
    eval {
        my $db = NnsBbs::Db::new($self);
        my ( $level, $moderator ) = access_level( $self, $db );
        die "no permission" unless $moderator;

        my $errors = [];

        # newsgroup max_idのチェック
        $db->execute("lock tables newsgroup write,article read");

        my $sql = "select newsgroup_id,max(id) as max_id from article";
        $sql .= " group by newsgroup_id";
        my $hh1 = $db->select_hh( $sql, 'newsgroup_id' );

        $sql = "select id,name,max_id,ord from newsgroup";
        my $hh2 = $db->select_hh( $sql, 'id' );

        $sql = "update newsgroup set max_id=? where id=?";
        my $cnt = 0;
        while ( my ( $id, $v ) = each %$hh2 ) {
            my $true        = $hh1->{$id};
            my $true_max_id = $true->{max_id} || 0;
            if ( $v->{max_id} != $true_max_id ) {
                $db->execute( $sql, $true_max_id, $id );
                $cnt++;
            }
        }
        $db->commit if $cnt > 0;
        $db->execute("unlock tables");
        $self->render( json => { result => 'ok', count => $cnt } );
    };
    $self->render( text => $@, status => '400' ) if $@;
}

1;
