--
-- make database "nnnsbbs" on mysql
-- 

create database if not exists nnsbbs character set utf8;
grant all on nnsbbs.* to "www-data"@"localhost"
  identified by "warawara";
grant all on nnsbbs.* to "nari"@"localhost";

