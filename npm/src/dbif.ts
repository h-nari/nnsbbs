import { option, select, selected } from "./tag"
import { get_json } from "./util";
import { ReadSet } from "./readSet";



interface IResult {
  result: 'ok' | 'ng';
}

//
// api/newsgroup
//

export interface TNewsgroup {
  id: number,
  name: string,
  comment: string,
  max_id: number,
  posted_at: string,
  rpl: number,
  wpl: number,
  bLocked: number,
  bDeleted: number,
  created_at: string,
  locked_at: string | null,
  deleted_at: string | null,
  ord: number
}

export function api_newsgroup() {
  return get_json('/api/newsgroup') as Promise<TNewsgroup[]>;
}
//
// api/titles
//
export interface ITitle {
  article_id: number;
  rev: number;
  date: string;
  user_id: string;
  disp_name: string;
  reply_to: number;
  title: string;
  children?: ITitle[];
  reaction: {
    [type_id: string]: number;
  }
};
export function api_titles(newsgroup_id: number, from: number, to: number) {
  return get_json('/api/titles', { data: { newsgroup_id, from, to } }) as Promise<ITitle[]>;
}


//
//  api/article
//
export interface IArticle {
  header?: string;
  content: string;
  date: string;
  author: string;
  user_id: string;
  title: string;
  article_id: string;
  rev: number;
  attachment: IAttachment[];
}

export interface IAttachment {
  file_id: string;
  comment: string;
  filename: string;
  content_type: string;
  size: number;
};

export function api_article(newsgroup_id: number, article_id: number, rev: number) {
  return get_json('/api/article',
    { data: { newsgroup_id, article_id, rev } }) as Promise<IArticle>;
}

//
//  api/membership
//
export interface IMembership { string: { id: number, name: string, selectable: number } };

export function api_membership() {
  return get_json('/api/membership') as Promise<IMembership>;
}
export function membership_select(membership: IMembership, value: string, type: 'normal' | 'all' = 'normal', opt_str: string = ''): string {
  let opt = '';
  let keys = Object.keys(membership);
  keys.sort((a, b) => Number(a) - Number(b));
  for (let i of keys) {
    let m = membership[i];
    if (m.selectable || type == 'all')
      opt += option({ value: i, selected: selected(i == value) }, opt_str + m.name);
  }
  return select(opt);
}
//
// api/profile_read
//
export interface IProfile {
  disp_name: string;
  created_at: string;
  membership_id: string;
  profile: string;
  signature: string;
  mail: string;
}

export function api_profile_read(user_id: string) {
  return get_json('/api/profile_read', { data: { user_id } }) as Promise<IProfile>;
}
//
// api/profile_write
//
export interface ArgProfile {
  user_id: string;
  disp_name?: string;
  membership_id?: string;
  profile?: string;
  signature?: string;
}

export function api_profile_write(a: ArgProfile) {
  return get_json('/api/profile_write', { method: 'post', data: a }) as Promise<IResult>;
}

//
// api/post
//
interface IPostArg {
  newsgroup_id: number;
  user_id: string;
  disp_name: string;
  title: string;
  content: string;
  reply_to: number;
}

interface IPostResult {
  result: 'ok' | 'ng';
  article_id: string;
}

export function api_post(arg: IPostArg) {
  return get_json('/api/post', { method: 'post', data: arg }) as Promise<IPostResult>;
}

export function api_attachment(fd: FormData) {
  return get_json('/api/attachment', {
    type: 'post',
    data: fd,
    processData: false,
    contentType: false
  }) as Promise<IResult>;
}
//
// api/login
//
export interface IUser {
  id: string;
  disp_name: string;
  membership_id: string;
  signature: string;
  moderator: number;
};

export interface ILogin {
  login: number;
  user: IUser;
}

export interface ILogout {
  login: number;
}

export function api_login(mail: string, pwd: string) {
  return get_json('/api/login', { method: 'post', data: { email: mail, pwd } }) as Promise<ILogin>;
}

export function api_logout() {
  return get_json('/api/logout') as Promise<ILogout>;
}

export function api_session() {
  return get_json('/api/session') as Promise<ILogin>;
}
//
// api/subsInfo
//
export interface IResultCount extends IResult {
  count: number;
}
export interface ISubsElem {
  newsgroup_id: string;
  subscribe: number;
  done: string;
  update: number;
}

export interface ISubsHash {
  [key: string]: ISubsElem;
}
export function api_subsInfo_read(user_id: string) {
  return get_json('/api/subsInfo', { data: { user_id } }) as Promise<ISubsHash>;
}
export function api_subsInfo_write(user_id: string, data: ISubsElem[]) {
  return get_json('/api/subsInfo', { method: 'post', data: { user_id, write: JSON.stringify(data) } }) as Promise<IResultCount>;
}

//
// api/reaction
//

export interface IReactionType {
  [key: string]: {
    id: number;
    name: string;
    icon: string;
  }
}
export interface IReactionTypeResult {
  result: 'ok' | 'ng';
  data: IReactionType;
}
export function api_reaction_type() {
  return get_json('/api/reaction_type') as Promise<IReactionTypeResult>;
}
export function api_reaction_write(newsgroup_id: number, article_id: string, rev: number, user_id: string, type_id: number) {
  return get_json('/api/reaction', { method: 'post', data: { newsgroup_id, article_id, rev, user_id, type_id } }) as Promise<IResult>;
}
export interface IReactionUser {
  result: 'ok' | 'ng';
  type_id: number;
}
export function api_reaction_user(newsgroup_id: number, article_id: string, rev: number, user_id: string) {
  return get_json('/api/reaction', { method: 'post', data: { newsgroup_id, article_id, rev, user_id } }) as Promise<IReactionUser>;
}
export interface IReaction {
  type_id: number;
  user_id: string;
  disp_name: string;
}
export interface IReactionResult {
  result: 'ok' | 'ng';
  data: IReaction[];
}
export function api_reaction(newsgroup_id: number, article_id: number, rev: number) {
  return get_json('/api/reaction', { method: 'post', data: { newsgroup_id, article_id, rev } }) as Promise<IReactionUser>;
}
//
// api/report_type
// api/report_treatment
//
export interface IId {
  [key: number]: { id: number, name: string }
}
export function api_report_type() {
  return get_json('/api/report_type') as Promise<IId>;
}
export function api_report_treatment() {
  return get_json('/api/report_treatment') as Promise<IId>;
}
//
// api/report
//
export interface IReport {
  type_id: number,
  treadment_id?: number,
  newsgroup_id: number,
  article_id: string,
  rev: number,
  notifier?: string,
  detail?: string,
  treatment_detail?: string
}
export function api_report(d: IReport) {
  return get_json('/api/report', { method: 'post', data: { insert: JSON.stringify(d) } }) as Promise<IResult>;
}

//
//  admin/api/user
//
export interface IUserAdmin {
  id: string, mail: string, disp_name: string, password: string,
  created_at: string, logined_at: string | null, reset_count: number,
  membership_id: string, moderator: number, admin: number, bBanned: number,
  banned_at: string | null, profile: string
}

//
//  admin/api/article
//
export interface TArticle {
  newsgroup_id: number,
  id: number,
  rev: number,
  rev_reason: string,
  title: string,
  reply_to: number,
  reply_rev: number,
  user_id: string,
  disp_name: string,
  ip: string,
  bDeleted: number,
  created_at: string,
  deleted_at: string | null,
  content: string | null
}

//
// admin/api/title
//
export function admin_api_title(user_id: string) {
  return get_json('/admin/api/title', { data: { user_id } }) as Promise<TArticle[]>;
}
//
// admin/api/report
//
export interface IReportAdmin {
  id: number;
  type_id: number;
  type: string;
  treatment_id: number;
  treatment: string;
  newsgroup: string;
  article_id: number;
  title: string;
  rev: number;
  disp_name: string;
  posted_at: string;
  notifier: string | null;
  detail: string;
  treatment_detail: string;
  created_at: string;
  response_at: string;
}
export interface ArgReportRead {
  limit?: number;
  offset?: number;
  search?: string;
  count?: true;
  order?: string;
  id?: number;
}
export function admin_api_report_read(d: ArgReportRead = {}) {
  return get_json('/admin/api/report', { data: d }) as Promise<IReportAdmin[]>;
}