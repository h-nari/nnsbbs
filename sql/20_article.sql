--
-- mysql:
--
drop table if exists article;
create table article (
  newsgroup_id integer      not null,
  id           integer      not null,
  rev          integer      default 0,      -- revision 
  rev_reason   text         default "",     -- 修正理由
  title        text         not null,
  reply_to     integer      default 0,
  reply_rev    integer      default 0,      -- replyした記事のrev
  user_id      varchar(255) not null,       -- 著者
  disp_name    varchar(255) default "",     -- 著者の表示名
  ip           varchar(255) default "",     -- 書き込み ipアドレス
  bDeleted     boolean      default false,  -- 削除
  created_at   datetime     default now(),  -- 投稿時間
  deleted_at   datetime,
  content      longtext     not null        -- 本文
);

create index article_idx on article (newsgroup_id, id);
create index article_reply_idx on article(reply_to);

insert into article (newsgroup_id, id, title, reply_to, user_id, disp_name, content)
values
(1, 1, "投稿テスト", 0, 'yamada', "山田", "投稿のテストです"),
(1, 2, "Re:投稿テスト", 1, 'yamada', "山田たろう", "投稿のテストです2"),
(1, 3, "Re:投稿テスト", 2, 'yamada', "山田二郎", "投稿のテストです3"),
(1, 4, "テストばかりで済みません", 0 , 'suzuki', "スズキ","投稿のテストです"),
(1, 5, "長ーいタイトル。長い長い長いabcdefghijklmnopqustuvwxyz . . . . ===========================", 0 , 'tanaka', "田中", "タイトルが長い投稿のテストです"),
(1, 6, "トップにリプライ", 1, 'tanaka', "", "header: value\n\nトップにリプライする実験\n改行とか使えるの？\n\nどうだろう\n"),
(2,1, "雑談しましょう",0, 'yamada', "やまだ","雑談にテスト"),
(2,2, "Re:雑談しましょう",1, 'yamada', "やーまだ", "何の話をしましょうか"),
(2,3, "そうは言っても",1, 'yamada', "あんな","うーむ"),
(2,4, "Headerのテスト",0,'yamada',"杏奈","Header: Test

本文。
Hello World.

長い文はねぇ.....
");

update newsgroup set max_id = 6 where id = 1;
update newsgroup set max_id = 4 where id = 2;




