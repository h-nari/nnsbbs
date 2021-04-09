import { get_json } from "./util";
import { div, button } from "./tag";
import { ToolBar } from "./toolbar";

export interface IArticle {
  header: string;
  content: string;
};

export class ArticlePane {
  private id: string = "article-pane";
  private id_header: string;
  private data: IArticle | null = null;
  public toolbar = new ToolBar('Article');
  private bDispHeader = false;              // 記事のヘッダー部を表示するか

  constructor() {
    this.id_header = this.id + "-header";
    this.clear();
  }

  clear() {
    this.data = { header: "", content: "" };
  }

  html(): string {
    let d = this.data;
    return this.toolbar.html() +
      div({ id: this.id, class: 'article fill' },
        div({ class: 'article-header', id: this.id_header }, d ? d.header : ""),
        div({ class: 'article-body fill' }, d ? d.content : ""));
  }

  bind() {
    if (!this.bDispHeader)
      $('#' + this.id_header).addClass('no-display');
    this.toolbar.bind();
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