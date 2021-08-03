package NnsBbs::ReadSet;
use List::Util qw(min max);
use Data::Dumper;
use strict;

sub new {
    my $class = shift;
    my $str   = shift;
    my $self  = bless { ranges => [] }, $class;
     $self->fromString($str) if $str;
     return $self;
}

sub clear {
    my $self = shift;
    $self->{ranges} = [];
    return $self;
}

sub toString {
    my $self = shift;
    my $s    = "";
    for my $r ( @{ $self->{ranges} } ) {
        $s .= ',' if $s ne "";
        $s .= $r->[0];
        if ( $r->[0] != $r->[1] ) {
            $s .= '-';
            $s .= $r->[1];
        }
    }
    return $s;
}

sub fromString {
    my $self           = shift;
    my $str            = shift;
    $self->{ranges} = [];

    $_ = $str;
    while (1) {
        $_ = $' if (/^\s+/);
        last if $_ eq '';
        &syntax_error( $_, $str ) unless (/^\d+/);
        $_ = $';
        my $start = $&;
        if (/^-\s*(\d+)/) {
            $_ = $';
            my $end = $1;
            $self->add_range( $start, $end );
        }
        else {
            $self->add_range( $start, $start );
        }
        $_ = $' if (/^s+/);
        last if $_ eq '';
        &syntax_error( $_, $str ) unless (/^,/);
        $_ = $';
    }
    return $self;
}

sub syntax_error {
    my $offendingStr = shift;
    my $allStr       = shift;
    my $pos          = length($allStr) - length($offendingStr);
    die
"readset SyntaxError: at pos $pos of \"$allStr\", offending str:\"$offendingStr\"\n";
}

sub add_range {
    my ( $self, $start, $end ) = @_;
    $end ||= $start;
    if ( $start <= $end ) {
        my $s          = $start;
        my $e          = $end;
        my @ranges     = @{ $self->{ranges} };
        my @new_ranges = ();
        my $r          = shift @ranges;
        while ( $r && $r->[1] < $s - 1 ) {
            push @new_ranges, $r;
            $r = shift @ranges;
        }
        while ( $r && $r->[0] <= $e + 1 ) {
            $s = min( $s, $r->[0] );
            $e = max( $e, $r->[1] );
            $r = shift @ranges;
        }
        push @new_ranges, [ $s, $e ];
        while ($r) {
            push @new_ranges, $r;
            $r = shift @ranges;
        }
        $self->{ranges} = \@new_ranges;
    }
    return $self;
}

sub sub_range {
    my $self  = shift;
    my $start = shift;
    my $end   = shift || $start;
    if ( $start <= $end ) {
        my $s          = $start;
        my $e          = $end;
        my @ranges     = @{ $self->{ranges} };
        my @new_ranges = ();

        my $r = shift @ranges;
        while ( $r && $r->[1] < $s ) {
            push @new_ranges, $r;
            $r = shift @ranges;
        }
        while ( $r && $r->[0] <= $e ) {
            push @new_ranges, [ $r->[0], $s - 1 ] if $r->[0] < $s;
            push @new_ranges, [ $e + 1, $r->[1] ] if $e < $r->[1];
            $r = shift @ranges;
        }
        while ($r) {
            push @new_ranges, $r;
            $r = shift @ranges;
        }
        $self->{ranges} = \@new_ranges;
        return $self;
    }
}

sub count {
    my $self = shift;
    my $n    = 0;
    for my $r ( @{ $self->{ranges} } ) {
        $n += $r->[1] - $r->[0] + 1;
    }
    return $n;
}

1;
