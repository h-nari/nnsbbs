import { admin_api_report_list, admin_api_report_read, api_report_treatment, api_report_type, IIdName, IReportAdmin } from "./dbif";
import { Menu } from "./menu";
import NnsBbs from "./nnsbbs";
import { a, button, div, input, option, select, selected, span, table, td, th, tr } from "./tag"

export class ReportManaget {
  private id = "report-manager";
  public parent: NnsBbs;
  private cReport: number = 0;    // number of reports that math the cuurent criteria
  private limit: number = 20;     // number of reports to display at a time
  private offset: number = 0;     // offset of the report being displayed
  private searchText: string = '';
  private reportList: IReportAdmin[] = [];
  private m_type = new Menu({ icon: 'funnel', explain: 'filter-reports-by-type' });
  private m_treatment = new Menu({ icon: 'funnel', explain: 'filter-reports-by-treatment' });

  constructor(parent: NnsBbs) {
    this.parent = parent;
    this.m_type.opt.action = async e => {
      let m = this.m_type;
      let i18next = this.parent.i18next;
      if (m.subMenu.length == 0) {
        let tobj = await api_report_type();
        let tlist = Object.values(tobj) as IIdName[];
        m.add(new Menu({ name: i18next.t('type-filer') }));
        m.add(new Menu({
          name: i18next.t('check-all'),
          action: e => { m.check_all(); e.stopPropagation(); }
        }));
        for (let t of tlist) {
          m.add(new Menu({
            name: i18next.t(t.name), with_check: true, arg: t, checked: true,
            action: (e, m) => {
              m.opt.checked = m.opt.checked ? !m.opt.checked : true;
              m.redisplay();
              e.stopPropagation();
            }
          }));
        }
        m.add(new Menu({
          name: i18next.t('execute'),
          action: e => { this.open(); }
        }));
      }
      m.expand(e);
    };

    this.m_treatment.opt.action = async e => {
      let m = this.m_treatment;
      if (m.subMenu.length == 0) {
        let tobj = await api_report_treatment();
        let i18next = this.parent.i18next;
        let tlist = Object.values(tobj) as IIdName[];
        m.add(new Menu({ name: i18next.t('treatment-filter') }));
        m.add(new Menu({
          name: i18next.t('check-all'),
          action: e => { m.check_all(); e.stopPropagation(); }
        }));
        for (let t of tlist) {
          m.add(new Menu({
            name: i18next.t(t.name), with_check: true, arg: t, checked: t.id == 0,
            action: (e, m) => {
              m.opt.checked = m.opt.checked ? !m.opt.checked : true;
              m.redisplay();
              e.stopPropagation();
            }
          }));
        }
        m.add(new Menu({
          name: i18next.t('execute'),
          action: e => { this.open(); }
        }));
      }
      m.expand(e);
    }
  }

  html() {
    return div({ id: this.id }, this.inner_html());
  }

  inner_html(): string {
    let i18next = this.parent.i18next;
    let c = '';

    c += tr(
      th({ i18n: 'id', class: 'id' }, 'no'),
      th({ i18n: 'reported-at', class: 'created_at' }, 'reported-at'),
      th({ i18n: 'notifier', class: 'notifier' }, 'notifier'),
      th({ class: 'type' }, span({ i18n: 'type' }), this.m_type.html()),
      th({ class: 'treatment' }, span({ i18n: 'treatment' }), this.m_treatment.html()),
      th({ i18n: 'article', class: 'article' }, 'article'),
      th({ i18n: 'article-title', class: 'title' }, 'title'));

    if (this.reportList.length == 0) {
      c += tr(td({ class: 'no-data', colspan: 7, i18n: 'there-is-no-data-to-display' }));
    } else {

      for (let r of this.reportList) {
        let article = '[' + r.newsgroup + '/' + r.article_id;
        if (r.rev > 0) article += '#' + r.rev;
        article += ']';
        let href = window.nnsbbs_baseURL + 'bbs/' + r.newsgroup + '/' + r.article_id + '/' + r.rev;
        c += tr(
          td({ class: 'id' }, a({ href: '/admin/report/' + r.id }, r.id)),
          td({ class: 'created_at' }, r.created_at),
          td({ class: 'notifier', }, r.notifier),
          td({ class: 'type', i18n: r.type }),
          td({ class: 'treatment', i18n: r.treatment }),
          td({ class: 'article' }, a({ href }, article)),
          td({ class: 'article-title' }, r.title)
        );
      }
    }


    let cur = Math.floor(this.offset / this.limit) + 1;
    let max = Math.ceil(this.cReport / this.limit)
    return div(
      div({ class: 'd-flex' },
        span({ class: 'mr-2' }, 'Number of Reports:'), span(this.cReport), span({ style: 'flex-grow:1' }),
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
      ), table({ class: 'report' }, c));
  }

  redisplay() {
    $('#' + this.id).html(this.inner_html());
    this.bind();
    this.parent.set_i18n_text();
  }

  bind() {
    this.m_treatment.bind();
    this.m_type.bind();
  }

  async open() {
    let types: number[] | undefined = this.m_type.subMenu.length > 0 ? checked_id_list(this.m_type) : undefined;
    let treatments: number[] = this.m_treatment.subMenu.length > 0 ? checked_id_list(this.m_treatment) : [0];
    this.reportList = await admin_api_report_list({ types, treatments });
    this.cReport = this.reportList.length;
    this.redisplay();
  }
}

function bb(icon: string, classname: string) {
  return button({ type: 'button', class: classname }, span({ class: 'bi-' + icon }));
}

function checked_id_list(menu: Menu) {
  let list: number[] = [];
  for (let m of menu.subMenu) {
    if (m.opt.with_check && m.opt.checked)
      list.push(m.opt.arg.id);
  }
  return list;
}