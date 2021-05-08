import { IMembership, IUserAdmin, membership_select } from "./dbif";
import { Menu } from "./menu";
import NnsBbs from "./nnsbbs";
import { div, table, tr, td, th, button, span, input, label, select, option, selected, a, icon, tag } from "./tag";
import { get_json } from "./util";

export class UserAdmin {
  public id = 'user-admin';
  public parent: NnsBbs;
  public membership: IMembership | null = null;
  private cUser: number = 0;     // Number of users that match the current criteria.
  private limit: number = 20;    // Number of users to display at a time
  private offset: number = 0;     // Offset of the user being displayed
  private searchText: string = '';
  private userList: IUserAdmin[] = [];
  private menuList: Menu[] = [];

  constructor(parent: NnsBbs) {
    this.parent = parent;
  }

  html(): string {
    return div({ id: this.id }, this.inner_html());
  }

  inner_html(): string {
    let c = '';
    for (let u of this.userList) {
      let menu = new Menu(icon('three-dots'));
      this.menuList.push(menu);
      menu.add(new Menu('Change User Setting', () => {
        this.change_user_dlg(u);
      }));
      let membership = '';
      if (u.moderator)
        membership = 'Moderator';
      else if (this.membership)
        membership = this.membership[u.membership_id].name;
      c += tr(
        td(a({ href: window.nnsbbs_baseURL + 'admin/user/' + u.id }, u.id)),
        td(u.disp_name),
        td(membership),
        td(u.mail),
        td(menu.html())
      );
    }
    let cur = Math.floor(this.offset / this.limit) + 1;
    let max = Math.ceil(this.cUser / this.limit)
    return div(
      div({ class: 'd-flex' },
        span({ class: 'mr-2' }, 'Number of Users:'), span(this.cUser), span({ style: 'flex-grow:1' }),
        span({ class: 'mr-2' }, 'page size:'),
        select({ class: 'page-size' },
          option({ value: 10, selected: selected(this.limit == 10) }, 10),
          option({ value: 20, selected: selected(this.limit == 20) }, 20),
          option({ value: 50, selected: selected(this.limit == 50) }, 50),
          option({ value: 100, selected: selected(this.limit == 100) }, 100),
          option({ value: 1000, selected: selected(this.limit == 1000) }, 1000)
        )),
      div({ class: 'btn-box d-flex' },
        bb('chevron-bar-left', 'page-begin'),
        bb('chevron-double-left', 'page-big-prev'),
        bb('chevron-left', 'page-prev'),
        span('Page:'),
        input({ type: 'number', class: 'pageNum', value: cur, min: 1, max }),
        span('/'),
        span(max),
        bb('chevron-right', 'page-next'),
        bb('chevron-double-right', 'page-big-next'),
        bb('chevron-bar-right', 'page-end'),
        span({ style: 'flex-grow:1' }),
        input({ type: 'search', class: 'search-text', placeholder: 'Search', value: this.searchText })
      ),
      div({ class: 'scroll' },
        table({ class: 'user-list' }, c)));
  }

  async redisplay(bFromDB: boolean = false) {
    if (bFromDB) {
      if (!this.membership)
        this.membership = await get_json('/api/membership') as IMembership;
      let d = await get_json('/admin/api/user', { data: { search: this.searchText, count: 1 } }) as any;
      this.cUser = d.count as number;
      this.userList = await get_json('/admin/api/user', { data: { limit: this.limit, offset: this.offset, search: this.searchText } }) as IUserAdmin[];
    }
    $('#' + this.id).html(this.inner_html());
    this.bind();
  }

  bind() {
    this.menuList.forEach(m => m.bind());
    $('#' + this.id + ' .page-prev').on('click', e => { this.page_move(-1); })
    $('#' + this.id + ' .page-next').on('click', e => { this.page_move(1); })
    $('#' + this.id + ' .page-big-prev').on('click', e => { this.page_move(-10); })
    $('#' + this.id + ' .page-big-next').on('click', e => { this.page_move(10); })
    $('#' + this.id + ' .page-begin').on('click', e => {
      this.offset = 0;
      this.redisplay(true);
    });
    $('#' + this.id + ' .page-end').on('click', e => {
      this.offset = Math.max(0, this.cUser - this.limit + 1);
      this.redisplay(true)
    });
    $('#' + this.id + ' .pageNum').on('change', e => {
      let page = $(e.currentTarget).val() as number;
      this.offset = (page - 1) * this.limit;
      this.redisplay(true);
    });
    $('#' + this.id + ' .search-text').on('change', e => {
      this.searchText = ($(e.currentTarget).val() || '') as string;
      this.offset = 0;
      this.redisplay(true);
    });
    $('#' + this.id + ' .page-size').on('change', e => {
      this.limit = ($(e.currentTarget).val() || '') as number;
      this.redisplay(true);
    });
  }


  page_move(n: number) {
    this.offset = Math.min(Math.max(this.offset + this.limit * n, 0), this.cUser);
    this.redisplay(true);
  }

  async change_user_dlg(u: IUserAdmin) {

    $.confirm({
      title: 'Change User Setting',
      type: 'orange',
      columnClass: 'medium',
      content: tag('form', { class: 'change-user-dlg overflow-hidden' },
        div({ class: 'form-row' }, div({ class: 'col title' }, 'user_id'), div({ class: 'col value' }, u.id)),
        div({ class: 'form-row' }, div({ class: 'col title' }, 'disp_name'),
          div({ class: 'col value' }, input({ class: 'disp-name', type: 'text', value: u.disp_name }))),
        div({ class: 'form-row' }, div({ class: 'col title' }, 'mail'), div({ class: 'col value' }, u.mail)),
        div({ class: 'form-row' }, div({ class: 'col title' }, 'moderator'),
          div({ class: 'col value' }, input({ type: 'checkbox', class: 'moderator', checked: selected(u.moderator != 0) }))),
        div({ class: 'form-row' }, div({ class: 'col title' }, 'membership'),
          this.membership ? div({ class: 'col value membership' }, membership_select(this.membership, u.membership_id)) : '')),
      buttons: {
        Save: async () => {
          let disp_name = $('.change-user-dlg .disp-name').val() as string;
          let moderator = $('.change-user-dlg .moderator').prop('checked') ? 1 : 0;
          let membership_id = $('.change-user-dlg .membership select').val() as string;
          let data = { id: u.id, disp_name, moderator };
          if (membership_id) data['membership_id'] = membership_id;
          await get_json('/admin/api/user', { method: 'post', data: { update: JSON.stringify([data]) } });
          this.redisplay(true);
        },
        Cancel: () => { }
      }
    });
  }
}

function bb(icon: string, classname: string) {
  return button({ type: 'button', class: classname }, span({ class: 'bi-' + icon }));
}