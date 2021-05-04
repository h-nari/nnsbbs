--
-- mysql:
--
drop table if exists article;
create table article (
  newsgroup_id integer      not null,
  id           integer      not null,
  rev          integer      default 0,      -- revision 
  rev_reason   text         default "",     -- 修正理由
  title        text         not null,
  reply_to     integer      default 0,
  reply_rev    integer      default 0,      -- replyした記事のrev
  user_id      varchar(255) not null,       -- 著者
  disp_name    varchar(255) default "",     -- 著者の表示名
  ip           varchar(255) default "",     -- 書き込み ipアドレス
  bDeleted     boolean      default false,  -- 削除
  created_at   datetime     default now(),  -- 投稿時間
  deleted_at   datetime,
  content      longtext     not null        -- 本文
);

create index article_idx on article (newsgroup_id, id);
create index article_reply_idx on article(reply_to);

