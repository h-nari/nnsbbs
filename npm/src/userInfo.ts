import NnsBbs from "./nnsbbs";
import { div, span, a } from "./tag";
import { admin_api_title, api_newsgroup, IMembership, IUserAdmin, TArticle, TNewsgroup, api_membership } from "./dbif";
import { get_json } from "./util";

export class UserInfo {
  private id = 'userInfo';
  private user_id: string | null = null;
  private parent: NnsBbs;
  private user: IUserAdmin | null = null;
  private membership: IMembership | null = null;
  private newsgroups: TNewsgroup[] | null = null;
  private id2newsgroup: { [id: string]: TNewsgroup } = {};
  private titles: TArticle[] = [];

  constructor(parent: NnsBbs) {
    this.parent = parent;
  }

  setUserId(user_id: string) {
    this.user_id = user_id;
    console.log('user_id:', user_id);
  }

  html(): string {
    return div({ id: this.id }, this.innerHtml());
  }

  innerHtml(): string {
    let u = this.user;
    if (!u) return div('no user info for user_id=', this.user_id || 'null');
    let membership = '';
    if (this.membership)
      membership = this.membership[u.membership_id].name;

    let titles = '';
    let cTitle = this.titles.length;
    for (let t of this.titles) {
      let n = this.id2newsgroup[t.newsgroup_id];
      let href = `${window.nnsbbs_baseURL}bbs/${n.name}/${t.id}`;
      titles += div(
        span({ class: 'created_at' }, t.created_at),
        span({ class: 'disp_name' }, t.disp_name),
        span({ class: 'ip' }, t.ip || 'no ip'),
        a({ class: 'article', href }, '[', span({ class: 'newsgroup' }, n.name), '/', span({ class: 'id' }, t.id), ']'),
        span({ class: 'title' }, t.title))
    }
    if (cTitle > 0)
      titles = div({ class: 'titles' }, div({ class: 'count' }, cTitle + ' article found.'), titles);
    else
      titles = div({ class: 'titles' }, "no article found");

    let info1 = div({ class: 'user-info1' },
      div(div('user_id:'), div(this.user_id || 'null')),
      div(div('disp_name:'), div(u.disp_name)),
      div(div('mail:'), div(u.mail)),
      div(div('membership:'), div(membership)),
      div(div('moderator:'), div(u.moderator ? 'Yes' : 'No')),
      div(div('admin:'), div(u.admin ? 'Yes' : 'No')),
      div(div('created_at:'), div(u.created_at)),
      div(div('logined_at:'), div(u.logined_at || "null")),
      div(div('reset_count:'), div(u.reset_count)),
      div(div('bBanned:'), div(u.bBanned ? 'Yes' : 'No')),
      div(div('banned_at:'), div(u.banned_at || "null"))
    );
    let profile = div({ class: 'profile' }, div('profile:'), div(u.profile));

    return div(info1, profile, titles);
  }

  bind() { }

  async redisplay(bLoadFromDB: boolean = false) {
    if (bLoadFromDB && this.user_id) {
      if (!this.membership) this.membership = await api_membership();
      if (!this.newsgroups) {
        this.newsgroups = await api_newsgroup();
        this.id2newsgroup = {};
        for (let n of this.newsgroups)
          this.id2newsgroup[n.id] = n;
      }
      this.user = await get_json('/admin/api/user', { data: { id: this.user_id } }) as IUserAdmin;
      this.titles = await admin_api_title(this.user_id);
    }
    $('#' + this.id).html(this.innerHtml());
    this.bind();
  }
};