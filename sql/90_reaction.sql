--
-- reaction to article
--
drop table if exists reaction;
drop table if exists reaction_type;
create table reaction_type (
  id          int              primary key,
  name        varchar(255)     not null,
  icon        varchar(255)     default ""
);
insert into reaction_type(id,name,icon) values 
(1, 'good',             'hand-thumbs-up-fill'),
(2, 'i-dont-think-so',  'hand-thumbs-down-fill'),
(3, 'i-dont-understand','question');

create table reaction (
  user_id      varchar(255) not null,
  newsgroup_id int          not null,
  article_id   int          not null,
  type_id      int          not null,
  created_at   datetime     default now(),
  foreign key(type_id) references reaction_type(id)
);
create unique index  reaction_idx on reaction(user_id,newsgroup_id,article_id);
create index  reaction_idx2 on reaction(newsgroup_id,article_id);
