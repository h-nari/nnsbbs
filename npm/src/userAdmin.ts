import NnsBbs from "./nnsbbs";
import { div, table, tr, td, th, button, span, input, label, select, option, selected } from "./tag";
import { get_json } from "./util";

interface IUserAdmin {
  id: string, mail: string, disp_name: string, password: string,
  created_at: string, logined_at: string | null, reset_count: number,
  membership: string, moderator: number, admin: number, bBanned: number,
  bannned_at: string | null, profile: string
};

export class UserAdmin {
  public id = 'user-admin';
  public parent: NnsBbs;
  private cUser: number = 0;     // Number of users that match the current criteria.
  private limit: number = 20;    // Number of users to display at a time
  private offset: number = 0;     // Offset of the user being displayed
  private searchText: string = '';
  private userList: IUserAdmin[] = [];

  constructor(parent: NnsBbs) {
    this.parent = parent;
  }

  html(): string {
    return div({ id: this.id }, this.inner_html());
  }

  inner_html(): string {
    let c = '';
    for (let u of this.userList) {
      c += tr(
        td(u.id),
        td(u.disp_name),
        td(u.mail)
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

  redisplay() {
    $('#' + this.id).html(this.inner_html());
    this.bind();
  }

  bind() {
    $('#' + this.id + ' .page-prev').on('click', e => { this.page_move(-1); })
    $('#' + this.id + ' .page-next').on('click', e => { this.page_move(1); })
    $('#' + this.id + ' .page-big-prev').on('click', e => { this.page_move(-10); })
    $('#' + this.id + ' .page-big-next').on('click', e => { this.page_move(10); })
    $('#' + this.id + ' .page-begin').on('click', e => {
      this.offset = 0;
      this.show();
    });
    $('#' + this.id + ' .page-end').on('click', e => {
      this.offset = Math.max(0, this.cUser - this.limit + 1);
      this.show();
    });
    $('#' + this.id + ' .pageNum').on('change', e => {
      let page = $(e.currentTarget).val() as number;
      this.offset = (page - 1) * this.limit;
      this.show();
    });
    $('#' + this.id + ' .search-text').on('change', e => {
      this.searchText = ($(e.currentTarget).val() || '') as string;
      this.offset = 0;
      this.show();
    });
    $('#' + this.id + ' .page-size').on('change', e => {
      this.limit = ($(e.currentTarget).val() || '') as number;
      this.show();
    });
  }

  async init() {
    this.offset = 0;
    this.show();
  }

  async show() {
    let d = await get_json('/admin/api/user', { data: { search: this.searchText, count: 1 } }) as any;
    this.cUser = d.count as number;
    this.userList = await get_json('/admin/api/user', { data: { limit: this.limit, offset: this.offset, search: this.searchText } }) as IUserAdmin[];
    this.redisplay();
  }

  page_move(n: number) {
    this.offset = Math.min(Math.max(this.offset + this.limit * n, 0), this.cUser);
    this.show();
  }
}

function bb(icon: string, classname: string) {
  return button({ type: 'button', class: classname }, span({ class: 'bi-' + icon }));
}