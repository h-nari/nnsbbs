--
-- mysql: nnsbbs
-- 
--
drop table if exists membership;
create table membership (
  id        integer       primary key,
  name       varchar(255)  not null,
  selectable boolean       default true
);

insert into membership (id,name,selectable)
values
(0, 'not logged in', false),
(1, 'class1', true),
(2, 'class2', true),
(3, 'class3', true),
(10, 'moderator', false);
