--
-- mysql: nnsbbs
--

drop table if exists subsInfo;
create table subsInfo (
  user_id      varchar(255) not null,
  newsgroup_id integer      not null,
  subscribe    boolean      default true,
  done         text         default ("")      -- A string representing the number of the article read.
);

create index subsInfo_idx1 on subsInfo (user_id);
create unique index subsInfo_idx2 on subsInfo (user_id, newsgroup_id);

