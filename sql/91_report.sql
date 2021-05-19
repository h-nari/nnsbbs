--
-- Ability to report inappropriate posts
--

drop table if exists report;
drop table if exists report_type;
drop table if exists report_treatment;

create table report_type (
  id      int               primary key,
  name    varchar(255)      not null
);

create table report_treatment (
  id      int               primary key,
  name    varchar(255)      not null
);

insert into report_type(id,name) values 
(1, 'crime-to-be-reported'),
(2, 'obscene-expression'),
(3, 'violation-of-copyright'),
(4, 'insulting-behavior'),
(5, 'malicious-hoax'),
(6, 'leak-of-personal-information'),
(7, 'phishing'),
(8, 'spam'),
(9, 'other');

insert into report_treatment(id,name) values
(0, 'not-yet'),
(1, 'under-consideration'),
(2, 'ignore'),
(3, 'partial-correction-of-the-article'),
(4, 'prohibit-the-display-of-articles'),
(5, 'report-to-the-police');

create table report (
  id                  int auto_increment primary key,
  type_id             int                not null,      -- type of report
  treatment_id        int                default 0,     -- reporting treatment
  newsgroup_id        int                not null,      -- article to be reported
  article_id          int                not null,      -- article to be reported
  rev                 int                not null,      -- article to be reported
  notifier            varchar(255) ,                    -- notifier of this report
  want_response       boolean            default false, -- notifier want response
  detail              text               default "",
  treatment_detail    text               default "",
  treated_by          varchar(255),                     -- who treat this report
  treated_at          datetime ,
  created_at          datetime           default now(),
  foreign key(type_id)      references report_type(id),
  foreign key(treatment_id) references report_treatment(id)
);

