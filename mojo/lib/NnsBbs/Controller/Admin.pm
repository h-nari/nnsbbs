package NnsBbs::Controller::Admin;
use Mojo::Base 'Mojolicious::Controller', -signatures;
use NnsBbs::Db;
use Data::Dumper;

sub user ($self) {
    my $s = "<script>\n";
    $s .= "\$(()=>{\n";
    $s .= "var ua = window.nnsbbs.userAdmin;\n";
    $s .= "\$('#main').html(ua.html());\n";
    $s .= "ua.init();";
    $s .= " });\n";
    $s .= "</script>\n";
    $self->stash( script_part => $s, page_title => 'ユーザ管理' );
    $self->render( template => 'admin/show' );
}

sub newsgroup($self) {
    my $db = NnsBbs::Db::new($self);
    $self->stash(
        script_part => '',
        page_title  => 'ニュースグループ管理'
    );
    $self->render( template => 'admin/show' );
}

sub api_newsgroup($self) {
    my $db  = NnsBbs::Db::new($self);
    my $sql = "select id,name,comment,max_id,posted_at";
    $sql .= ",access_group,bLocked,bDeleted,created_at";
    $sql .= ",locked_at,deleted_at,ord0,ord";
    $sql .= " from newsgroup";
    $sql .= " order by ord,name";
    my $data = $db->select_ah($sql);
    $self->render( json => $data );
}

sub api_user($self) {
    my $limit  = $self->param('limit');
    my $offset = $self->param('offset');
    my $search = $self->param('search');
    my $count  = $self->param('count');
    my $order  = $self->param('order');
    my $db     = NnsBbs::Db::new($self);
    my $sql    = "select";
    my @param  = ();
    $sql .= $count ? " count(*) as count" : " *";
    $sql .= " from user";

    if ($search) {
        my $pat = '%' . $search . '%';
        $sql .= " where disp_name like ? or mail like ? ";
        $sql .= " or id like ? or profile like ?";
        push( @param, $pat, $pat, $pat, $pat );
    }

    if ($order) {
        $sql .= " order by $order";
    }
    else {
        $sql .= " order by created_at";
    }
    if ($limit) {
        $sql .= " limit ?";
        push( @param, $limit );
        if ($offset) {
            $sql .= " offset ?";
            push( @param, $offset );
        }
    }
    my $data;
    if ($count) {
        $data = $db->select_rh( $sql, @param );
    }
    else {
        $data = $db->select_ah( $sql, @param );
    }
    $self->render( json => $data );
}

1;
