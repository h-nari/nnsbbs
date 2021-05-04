--
-- mysql: nnsbbs
--

drop table if exists subscribe;
create table subscribe (
  user_id      integer      not null,
  newsgroup_id integer      not null,
  subscribe    boolean      default true,
  done         text         default ""      -- 読んだ記事番号を表す文字列
);

create unique index subscribe_idx on subscribe (user_id, newsgroup_id);

