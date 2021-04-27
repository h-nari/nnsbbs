--
-- table for mail address authorization
--
drop table if exists mail_auth;
create table mail_auth (
  id          char(12)       primary key,
  email       varchar(255)   not null,
  created_at  datetime       default now()
);
