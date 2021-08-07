--
-- mysql
--
drop table if exists user_attr;
create table user_attr (
  user_id    varchar(255)     primary key,
  attr       varchar(255)     not null,
  value      text             not null
);
