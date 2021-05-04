--
-- mysql
--
drop table if exists newsgroup ;
create table  newsgroup (
  id           integer      auto_increment primary key, 
  name         varchar(255) not null,
  max_id       integer      default 0,
  access_group integer      default 0,         -- ニュースグループのアクセス制限のグループ
  bLocked      boolean      default false,     -- 投稿できない
  bDeleted     boolean      default false,     -- 表示されない
  created_at   datetime     default now(),
  posted_at    datetime     default now(),     -- 最新の記事が投稿された時間
  locked_at    datetime,
  deleted_at   datetime,
  ord0         integer      default 0,         -- 同じ階層での順序付け用   
  ord          integer      default 0,         -- 全体での表示順
  comment      text         default ""         -- ニュースグループの説明    
);

