import { get_json } from "./util";
import { div, button } from "./tag";
import { ToolBar } from "./toolbar";
import { ToolbarPane } from "./pane";

export interface ITitle {
  article_id: number;
  date: string;
  disp_name: string;
  reply_to: number;
  title: string;
  user_id: number;
  children?: ITitle[];
};

export class TitlesPane extends ToolbarPane {
  private titles: ITitle[] = [];
  private threads: ITitle[] | null = null;
  private newsgroup_name: string | null = null;
  private newsgroup_id: number | null = null;
  private bDispTherad: boolean = true;
  private thread_depth: number = 20;
  private clickCb: ((newsgroup_id: number, article_id: number) => void) | null = null;
  private id_lg: string;

  constructor(id: string) {
    super(id);
    this.id_lg = id + "_lg";
  }

  async open(newsgroup_id: number, newsgroup_name: string) {
    let data = await get_json('/api/titles', { data: { newsgroup_id } });
    this.titles = [];
    this.threads = [];
    for (let d of data as ITitle[]) {
      let id = d.article_id;
      this.titles[id] = d;
      let parent = this.titles[d.reply_to];
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(d);
      } else {
        this.threads.push(d);
      }
    }
    this.toolbar.title = newsgroup_name;
    this.newsgroup_id = newsgroup_id;
    this.newsgroup_name = newsgroup_name;
  }

  setClickCb(cb: (n: number, m: number) => void) {
    this.clickCb = cb;
  }

  html(): string {
    return div({ id: this.id }, this.inner_html());
  }

  inner_html(): string {
    let s = "";
    if (this.bDispTherad && this.threads) {
      for (let t of this.threads) {
        s += this.thread_html(t, 0);
      }
    } else {
      for (let id in this.titles) {
        let d = this.titles[id];
        s += this.title_html(d, 0);
      }
    }
    return this.toolbar.html() + div({ class: 'titles' }, div({ id: this.id_lg, class: 'nb-list-group' }, s));
  }

  thread_html(t: ITitle, depth: number) {
    let s = this.title_html(t, depth);
    if (t.children) {
      for (let c of t.children) {
        s += this.thread_html(c, depth + this.thread_depth);
      }
    }
    return s;
  }

  title_html(d: ITitle, depth: number) {
    let s = button({ article_id: d.article_id },
      div({ class: 'article-id' }, String(d.article_id)),
      div({ class: 'article-from' }, d.disp_name),
      div({ class: 'article-time' }, d.date),
      div({ class: 'article-title', style: `left: ${depth}px;` }, d.title)
    );
    return s;
  }


  bind() {
    super.bind();
    $(`#${this.id_lg} >button`).on('click', ev => {
      let target = ev.currentTarget;
      let article_id: number = target.attributes['article_id'].value;
      this.select_article(article_id);
      if (this.newsgroup_id && this.clickCb) {
        this.clickCb(this.newsgroup_id, article_id);
      }
    });
  }

  select_article(id: number) {
    $(`#${this.id_lg} >button`).removeClass('active');
    $(`#${this.id_lg} >button[article_id=${id}]`).addClass('active');
  }
}