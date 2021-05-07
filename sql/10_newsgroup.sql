--
-- mysql
--
drop table if exists newsgroup ;
create table  newsgroup (
  id           integer      auto_increment primary key, 
  name         varchar(255) not null,
  max_id       integer      default 0,
  rpl          integer      default 0,         -- read  permission level, user whose membership >= rpl can read
  wpl          integer      default 1,         -- write permission level, user whose membership >= wpl can write
  bLocked      boolean      default false,     -- no posting
  bDeleted     boolean      default false,     -- marked as deleted, no display
  created_at   datetime     default now(),
  posted_at    datetime     default now(),     -- last post time
  locked_at    datetime,
  deleted_at   datetime,
  ord          integer      default 0,         -- Value for determining the display order.
  comment      text         default ""         -- Newsgroups Description  
);

