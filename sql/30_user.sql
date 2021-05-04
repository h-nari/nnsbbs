--
-- mysql
--
drop table if exists user;
create table user (
  id   	      varchar(255)  primary key,
  mail        varchar(255)  not null,
  disp_name   varchar(255)  not null,
  password    varchar(255)  not null,       -- 暗号化されたパスワード
  created_at  datetime      default now(),
  logined_at  datetime,                     -- 最終ログイン時刻
  reset_count int           default 0,      -- パスワードリセットの回数
  membership  int           default 0,      -- アクセス権限 
  moderator   boolean       default false,
  admin       boolean       default false,
  bBanned     boolean       default false,
  banned_at   datetime,  
  profile     text          default ""      -- プロフィール
);
create unique index user_mail on user(mail);

