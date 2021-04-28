--
-- table for session information
--
drop table if exists session;
create table session (
  id            varchar(255)         primary key,
  user_id       varchar(255)         not null,
  created_at    datetime             default now(),
  last_access   datetime             default now()
);
