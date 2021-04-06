--
-- mysql
--
drop table if exists user;
create table user (
  id   	      integer       auto_increment primary key,
  mail        varchar(255)  not null,
  disp_name   varchar(255)  not null,
  password    varchar(255)  not null,       -- 暗号化されたパスワード
  created_at  datetime      default now(),
  reset_count int           default 0,      -- パスワードリセットの回数
  access_auth int           default 0,      -- アクセス権限 
  bBanned     boolean       default false,
  banned_at   datetime,  
  profile     text          default ""      -- プロフィール
);

insert into user (disp_name,mail,password)
values
('nari', 'nari@mxb.mesh.ne.jp', '*'),
('なりまつ', 'nari2@humblesoft.com', '*'),
('成松', 'nari3@humblesoft.com', '*');


