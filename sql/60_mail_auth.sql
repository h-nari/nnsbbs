--
-- table for mail address authorization
--
drop table if exists mail_auth;
create table mail_auth (
  id          char(12)       primary key,
  email       varchar(255)   not null,
  action      varchar(255)   not null,      -- MAIL_AUTH or PASSWORD_RESET
  created_at  datetime       default now()
);
