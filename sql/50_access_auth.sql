--
-- mysql: nnsbbs
-- アクセス権限テーブル
--
drop table if exists access_auth;
create table access_auth (
  id        integer       primary key,
  ord       integer       default 0,        -- 並び順
  name      varchar(255)  default "",       -- 権限名
  admin     boolean       default false     -- 管理者権限
);

-- news group access group毎のアクセス権限
drop table if exists ng_auth;
create table ng_auth (
  aa_id    integer        not null,         -- アクセス権限id
  ngag     integer        not null,         -- news group access group
  readable boolean        default true,     -- 読み出し権限
  writable boolean        default false     -- 書き込み権限
);

create unique index ngag_idx on ng_auth (aa_id, ngag);

