import { admin_api_report_read, admin_api_report_update, api_report_treatment, IReportAdmin } from "./dbif";
import NnsBbs from "./nnsbbs";
import { a, button, div, option, select, selected, span, tag } from "./tag";

export class ReportPage {
  private id = "report-page";
  public parent: NnsBbs;
  public report: IReportAdmin | null = null;

  constructor(parent: NnsBbs) {
    this.parent = parent;
  }

  html(): string {
    return div({ id: this.id }, this.innerHtml());
  }

  innerHtml(): string {
    let r = this.report;
    if (r) {
      let article = '[' + r.newsgroup + '/' + r.article_id;
      if (r.rev > 0) article += '#' + r.rev;
      article += ']';
      let link = window.nnsbbs_baseURL + 'bbs/' + r.newsgroup + '/' + r.article_id + '/' + r.rev;
      return div({ class: 'report-page' },
        a({ href: window.nnsbbs_baseURL + 'admin/report', i18n: 'to-report-list' }),
        div({ class: 'report-part' },
          div({ class: 'line' },
            div({ class: 'id' }, div({ class: 'title', i18n: 'report-no' }), ':', div({ class: 'value' }, r.id)),
            div({ class: 'created_at' }, div({ i18n: 'report-time', class: 'title' }), ':', div({ class: 'value' }, r.created_at)),
            div({ class: 'notifier' }, div({ i18n: 'notifier', class: 'title' }), ':', div({ class: 'value' }, r.notifier)),
            div({ class: 'type' }, div({ i18n: 'report-type', class: 'title' }), ':', div({ i18n: r.type, class: 'value' }))),
          div({ class: 'detail' }, div({ i18n: 'report-detail', class: 'title' }), div({ class: 'value' }, r.detail)),
        ),
        div({ class: 'article-part' },
          div({ class: 'line' },
            div({ class: 'article' }, div({ i18n: 'article', class: 'title' }), ':', div({ class: 'value' }, a({ href: link }, article))),
            div({ class: 'disp_name' }, div({ i18n: 'article-author', class: 'title' }), ':', div({ class: 'value' }, r.disp_name)),
            div({ class: 'posted_at' }, div({ i18n: 'article-posted-at', class: 'title' }), ':', div({ class: 'value' }, r.posted_at))),
          div({ class: 'line' },
            div({ class: 'title' }, div({ i18n: 'article-title', class: 'title' }), ':', div({ class: 'value' }, r.title)))
        ),
        div({ class: 'treatment-part' },
          div({ class: 'line' },
            div({ class: 'treatment' }, div({ i18n: 'treatment', class: 'title' }), ':', div({ i18n: r.treatment, class: 'value' })),
            div({ class: 'response_at' }, div({ i18n: 'treatment-at', class: 'title' }), ':', div({ class: 'value' }, r.treated_at)),
            button({ class: 'btn btn-primary btn-treat-input', i18n: 'treat-input' })),
          div({ class: 'detail' }, div({ i18n: 'treatment-detail', class: 'title' }),
            div({ class: 'treatment_detail value' }, r.treatment_detail)),
        )
      )
    } else {
      return div({ i18n: 'no-data' });
    }
  }

  bind() {
    $(`#${this.id} .btn-treat-input`).on('click', e => {
      this.treat_input_dlg();
    })
  }

  redisplay() {
    $('#' + this.id).html(this.innerHtml());
    this.bind();
    this.parent.set_i18n_text();
  }

  async open(id: number) {
    this.report = await admin_api_report_read(id);
    this.redisplay();
  }

  async treat_input_dlg() {
    var i18next = this.parent.i18next;
    let t_hash = await api_report_treatment();
    let vals = Object.values(t_hash);
    let s = select({ class: 'treatment-id' }, ...vals.map(t =>
      option({ value: t.id, selected: selected(t.id == this.report?.treatment_id) }, i18next.t(t.name))));
    $.confirm({
      title: i18next.t('treat-input'),
      type: 'red',
      columnClass: 'large',
      content: div({ class: 'treat-input' },
        div({ class: 'line' }, div({ class: 'title' }, i18next.t('treatment')), ':', div({ class: 'value' }, s)),
        div({ class: 'treatment-detail' },
          div({ class: 'title' }, i18next.t('treatment-detail')),
          tag('textarea', this.report?.treatment_detail))
      ),
      buttons: {
        'write': {
          text: i18next.t('write'),
          action: () => {
            if (!this.report) return;
            let treatment_id = $('.treat-input .treatment-id').val() as string;
            let treatment_detail = $('.treat-input .treatment-detail textarea').val() as string;
            admin_api_report_update({ id: this.report.id, treatment_id: Number(treatment_id), treatment_detail }).then(() => {
              if (this.report) this.open(this.report.id);
              this.parent.topBar.update_badge();
            });

          }
        },
        'cancel': {
          text: i18next.t('cancel'),
          action: () => { }
        }
      }
    });
  }
}