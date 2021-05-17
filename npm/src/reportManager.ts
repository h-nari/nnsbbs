import { admin_api_report_read, IReportAdmin } from "./dbif";
import NnsBbs from "./nnsbbs";
import { a, div, table, td, th, tr } from "./tag"

export class ReportManaget {
  private id = "report-manager";
  public parent: NnsBbs;
  private cReport: number = 0;    // number of reports that math the cuurent criteria
  private limit: number = 20;     // number of reports to display at a time
  private offset: number = 0;     // offset of the report being displayed
  private searchText: string = '';
  private reportList: IReportAdmin[] = [];

  constructor(parent: NnsBbs) {
    this.parent = parent;
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
      th({ i18n: 'type', class: 'type' }, 'type'),
      th({ i18n: 'treatment', class: 'treatment' }, 'treatment'),
      th({ i18n: 'article', class: 'article' }, 'article'),
      th({ i18n: 'article-title', class: 'title' }, 'title'));

    for (let r of this.reportList) {
      let article = '[' + r.newsgroup + '/' + r.article_id;
      if (r.rev > 0) article += '#' + r.rev;
      article += ']';
      let href = window.nnsbbs_baseURL + 'bbs/' + r.newsgroup + '/' + r.article_id + '/' + r.rev;
      c += tr(
        td({ class: 'id' }, r.id),
        td({ class: 'created_at' }, r.created_at),
        td({ class: 'notifier', }, r.notifier),
        td({ class: 'type', i18n: r.type }),
        td({ class: 'treatment', i18n: r.treatment }),
        td({ class: 'article' }, a({ href }, article)),
        td({ class: 'article-title' }, r.title)
      );
    }
    return table({ class: 'report' }, c);
  }

  redisplay() {
    $('#' + this.id).html(this.inner_html());
    this.bind();
  }

  bind() {
  }

  async open() {
    this.reportList = await admin_api_report_read();
    this.redisplay();
  }
}