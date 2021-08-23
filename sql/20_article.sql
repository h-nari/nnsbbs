--
-- mysql:
--
drop table if exists article;
create table article (
  newsgroup_id  integer      not null,
  id            integer      not null,
  title         text         not null,
  reply_to      integer      default 0,
  user_id       varchar(255) not null,       -- Author
  disp_name     varchar(255) default "",     -- Author's display name
  ip            varchar(255) default "",     -- IP address of the writing source
  bDeleted      boolean      default false,  -- delete flag
  created_at    datetime     default now(),  -- Post time
  deleted_at    datetime,
  delete_reason text         default "",
  content       longtext     not null        -- body of article,
  revised_by    integer      default 0,
  bReplied      boolean      default false
);

create index article_idx on article (newsgroup_id, id);
create index article_reply_idx on article(reply_to);

