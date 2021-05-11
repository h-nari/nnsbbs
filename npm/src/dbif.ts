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

export function api_article(newsgroup_id: number, article_id: number) {
  return get_json('/api/article',
    { data: { newsgroup_id, article_id } }) as Promise<IArticle>;
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
  subsInfo: string;
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
  subsInfo?: string;
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
  name: string;
  membership_id: string;
  signature: string;
  subsInfo: string;
};

export interface ILogin {
  login: number;
  user: IUser;
}

export function api_login(mail: string, pwd: string) {
  return get_json('/api/login', { method: 'post', data: { email: mail, pwd } }) as Promise<ILogin>;
}

export function api_logout() {
  return get_json('/api/login') as Promise<ILogin>;
}

export function api_session() {
  return get_json('/api/session') as Promise<ILogin>;
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

