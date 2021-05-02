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
  access_auth int           default 0,      -- アクセス権限 
  bBanned     boolean       default false,
  banned_at   datetime,  
  profile     text          default ""      -- プロフィール
);
create unique index user_mail on user(mail);

insert into user (id, disp_name,mail,password)
values
('nari',  'nari', 'nari@mxb.mesh.ne.jp', '1f5c9bcd5574ea919399202dea9361f82934a28a'),
('nari2', 'なりまつ', 'nari2@humblesoft.com', '*'),
('nari3', '成松', 'nari3@humblesoft.com', '*'),
('yamada', '山田杏奈', 'anna@humblesoft.com', '*'),
('tanaka', '田中R次郎', 'tanaka@humblesoft.com', '*'),
('suzuki', 'スズキ・モーターズ', 'suzuki@humblesoft.com', '*');

-- php -r "print 'sha1('password').'\n';"  
