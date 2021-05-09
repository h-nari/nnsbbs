--
-- mysql
--
drop table if exists user;
create table user (
  id   	        varchar(255)  primary key,
  mail          varchar(255)  not null,
  disp_name     varchar(255)  not null,
  password      varchar(255)  not null,       -- hashed password
  created_at    datetime      default now(),
  logined_at    datetime,                     -- last login time
  reset_count   int           default 0,      -- password reset count
  membership_id int           default 0, 
  moderator     boolean       default false,
  admin         boolean       default false,
  bBanned       boolean       default false,
  banned_at     datetime,  
  banned_reason text          default "",
  profile       text          default ""      
);
create unique index user_mail on user(mail);

