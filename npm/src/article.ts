import { get_json } from "./util";
import { div, button, span } from "./tag";
import { ToolBar } from "./toolbar";
import { ToolbarPane } from "./pane";

export interface IArticle {
  header?: string;
  content: string;
  date: string;
  author: string;
  title: string;
};

export class ArticlePane extends ToolbarPane {
  private id_header: string;
  private data: IArticle | null = null;
  private bDispHeader = false;              // 記事のヘッダー部を表示するか
  public fNext: (() => void) | null = null;  // --End--部をクリックした時に実行

  constructor(id: string) {
    super(id);
    this.id_header = this.id + "-header";
    this.clear();
    this.toolbar.title = 'Article';
  }

  clear() {
    this.data = { content: "", date: "", author: "", title: "" };
  }

  html(): string {
    return div({ id: this.id }, this.inner_html());
  }

  inner_html(): string {
    let d = this.data;
    let header = d && d.header ? d.header : "";
    let content = d ? d.content : "";

    return this.toolbar.html() +
      div({ class: 'article' },
        div({ class: 'article-header', id: this.id_header }, header),
        div({ class: 'article-body' }, content),
        div({ class: 'article-end' }, "--- End (click to next)---"));
  }

  bind() {
    super.bind();
    if (!this.bDispHeader)
      $('#' + this.id_header).addClass('no-display');
    $(`#${this.id} .article-end`).on('click', () => {
      if (this.fNext) this.fNext();
    });
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
    this.data = data;
    this.toolbar.title =
      span({ class: 'id' }, '[' + article_id + ']') +
      span({ class: 'author' }, data.author) +
      span({ class: 'date' }, data.date) +
      span({ class: 'title' }, data.title);
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