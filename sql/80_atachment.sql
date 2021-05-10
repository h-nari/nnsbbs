--
-- attached file
--
drop table if exists attached_file;
create table attached_file (
  id              varchar(255)    primary key,
  filename        text            not null,
  content_type    varchar(255)    not null,
  user_id         varchar(255)    not null,
  deleted         boolean         default false,
  delete_reason   text            default "",
  data longblob,
  created_at      datetime        default now()
);

drop table if exists attachment;
create table  attachment (
  file_id       varchar(255)   not null,
  newsgroup_id  int            not null,
  article_id    int            not null,
  rev           int            not null,
  comment       text           default "",
  ord           int            default 0,
  created_at    datetime       default now()
);

create index attachment_idx on attachment(newsgroup_id,article_id,rev);
create index attachment_idx2 on attachment(file_id);
