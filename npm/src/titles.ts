import { get_json } from "./util";
import { div, button, span } from "./tag";
import { ToolBar } from "./toolbar";
import { ToolbarPane } from "./pane";
import { ReadSet } from "./readSet";
import { ISubsInfo } from "./newsgroup";

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
  public subsInfo: ISubsInfo = { subscribe: false, read: new ReadSet() };
  private titles: ITitle[] = [];
  private threads: ITitle[] | null = null;
  private newsgroup_name: string | null = null;
  private newsgroup_id: number | null = null;
  private cur_article_id: number | null = null;
  private bDispTherad: boolean = false;
  private thread_depth: number = 20;
  private clickCb: ((newsgroup_id: number, article_id: number) => void) | null = null;
  private id_lg: string;

  constructor(id: string) {
    super(id);
    this.id_lg = id + "_lg";
  }

  async open(newsgroup_id: number, newsgroup_name: string, subsInfo: ISubsInfo) {
    this.subsInfo = subsInfo;
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
    this.newsgroup_id = newsgroup_id;
    this.newsgroup_name = newsgroup_name;
    this.cur_article_id = null;
    this.set_title();
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

  redisplay() {
    let scroll = $(`#${this.id} .titles`).scrollTop();
    $('#' + this.id).html(this.inner_html());
    this.bind();
    $(`#${this.id} .titles`).scrollTop(scroll || 0);
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
    let opt = { article_id: d.article_id };
    let c: string[] = [];
    if (this.subsInfo.read.includes(d.article_id))
      c.push('read');
    if (this.cur_article_id == d.article_id)
      c.push('active');
    if (c.length > 0) opt['class'] = c.join(' ');
    let s = button(opt,
      div({ class: 'article-id' }, String(d.article_id)),
      div({ class: 'article-from', title: d.disp_name }, d.disp_name),
      div({ class: 'article-time' }, d.date),
      div({ class: 'article-title', title: d.title, style: `left: ${depth}px;` }, d.title)
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
    const scroller = `#${this.id} .titles`;
    const scrollee = scroller + ' >div';
    const line = scrollee + ` >button[article_id=${id}]`;
    $(scrollee + ' >button').removeClass('active');
    $(line).addClass('active');
    this.cur_article_id = id;
    let y = $(line).position().top;
    console.log('y:', y);
    let sy = $(scroller).scrollTop() || 0;
    let sh = $(scroller).height() || 0;
    let lh = $(line).height() || 0;
    if (y < 0)
      $(scroller).scrollTop(sy + y);
    else if (y + lh > sh) {
      $(scroller).scrollTop(sy + y);
    }
  }

  disp_thread(bThread: boolean) {
    this.bDispTherad = bThread;
    this.set_title();
    $('#' + this.id).html(this.inner_html());
    this.bind();
  }

  set_title() {
    let s = "";
    s += span({ class: 'newsgroup-name' }, this.newsgroup_name || "");
    s += span({ class: 'subscription' }, '(', this.subsInfo.subscribe ? '購読中' : '未購読', ')');
    s += span({ class: 'disp-mode' }, this.bDispTherad ? '[スレッド表示]' : '[投稿順表示]');
    this.toolbar.title = s;
  }

  scrollToNextUnread() {
    console.log('scroll to next unread');

    let cur = $(`#${this.id} .nb-list-group button[active]`)[0];
    if (!cur) {
      let titles = $(`#${this.id} .nb-list-group button`);
      if (titles.length > 0) {
        cur = titles[0];
      } else {
        console.log('no article in this newsgroup');
        return;
      }
    }
    console.log('cur:', cur);
    let node = cur.nextElementSibling as HTMLElement;
    while (node && node.classList.contains('read'))
      node = node.nextElementSibling as HTMLElement;
    if (node) {
      let id = node.attributes['article_id'].value;
      console.log('next unread article:', id);
      this.select_article(id);
    } else {
      console.log('no next unread article');
    }
  }
}