--
-- mysql: nnsbbs
-- 
--
drop table if exists membership;
create table membership (
  id        integer       primary key,
  name      varchar(255)  not null
);

insert into membership (id,name)
values
(1, 'class1'),
(2, 'class2'),
(3, 'class3'),
(4, 'class4');
