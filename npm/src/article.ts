import { get_json, escape_html } from "./util";
import { div, button, span } from "./tag";
import { ToolBar } from "./toolbar";
import { ToolbarPane } from "./pane";
import NnsBbs from "./nnsbbs";

export interface IArticle {
  header?: string;
  content: string;
  date: string;
  author: string;
  user_id: string;
  title: string;
  article_id: string;
  rev: number;
};

export class ArticlePane extends ToolbarPane {
  private id_header: string;
  public article: IArticle | null = null;
  private bDispHeader = false;               // Flag to display the header section of the article.
  public fNext: (() => void) | null = null;  // invoked when end part clicked

  constructor(id: string, parent: NnsBbs) {
    super(id, parent);
    this.id_header = this.id + "-header";
    this.clear();
    this.toolbar.title = 'Article';
  }

  clear() {
    this.article = null;
  }

  html(): string {
    return div({ id: this.id }, this.inner_html());
  }

  inner_html(): string {
    let d = this.article;
    let header = d && d.header ? d.header : "";
    let content = d ? d.content : "";

    return this.toolbar.html() +
      div({ class: 'article' },
        div({ class: 'article-header', id: this.id_header }, escape_html(header)),
        div({ class: 'article-body' }, escape_html(content)),
        div({ class: 'article-end', 'html-i18n': 'end-click-to-next' }, "--- End (click to next)---"));
  }

  bind() {
    super.bind();
    if (!this.bDispHeader)
      $('#' + this.id_header).addClass('no-display');
    $(`#${this.id} .article-end`).on('click', () => {
      if (this.fNext) this.fNext();
    });
    $(`#${this.id} .toolbar-title .author`).on('click', ev => {
      if (this.article)
        this.parent.user.show_profile(this.article.user_id);
    });
  }

  redisplay() {
    $('#' + this.id).html(this.inner_html());
    this.bind();
  }

  async open(newsgroup_id: number, article_id: number) {
    let data = await get_json('/api/article',
      { data: { newsgroup_id, article_id } }) as IArticle;
    let c = data.content;
    let i = c.indexOf('\n\n');
    if (i >= 0) {
      data['header'] = c.substring(0, i);
      data['content'] = c.substring(i + 2);
    } else {
      data['header'] = "";
    }
    this.article = data;
    this.toolbar.title =
      span({ class: 'id' }, '[' + article_id + ']') +
      span({ class: 'author' }, escape_html(data.author)) +
      span({ class: 'date' }, data.date) +
      span({ class: 'title' }, escape_html(data.title));
  }

  setHeaderDisp(bDisp: boolean) {
    if (bDisp)
      $('#' + this.id_header).removeClass('no-display');
    else
      $('#' + this.id_header).addClass('no-display');
    this.bDispHeader = bDisp;
  }

  toggle_header() {
    this.setHeaderDisp(!this.bDispHeader);
  }
}