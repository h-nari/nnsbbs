import { get_json } from "./util";
import { div, button } from "./tag";

export interface IArticle {
  header: string;
  content: string;
};

export class ArticlePane {
  private id: string = "article-pane";
  private data: IArticle | null = null;

  constructor() {
    this.clear();
  }

  clear() {
    this.data = { header: "", content: "" };
  }

  html(): string {
    let d = this.data;
    return div({ id: this.id, class: 'article pane' },
      div({ class: 'article-header' }, d ? d.header : ""),
      div({ class: 'article-body' }, d ? d.content : ""));
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
}