import { get_json, escape_html } from "./util";
import { div, button, span } from "./tag";
import { ToolBar } from "./toolbar";
import { ToolbarPane } from "./pane";
import { ReadSet } from "./readSet";
import { INewsGroup, ISubsInfo } from "./newsgroup";
import NnsBbs from "./nnsbbs";

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
  public newsgroup: INewsGroup | null = null;
  public cur_article_id: number | null = null;
  private bDispTherad: boolean = true;
  private clickCb: ((newsgroup_id: number, article_id: number) => void) | null = null;
  private id_lg: string;
  public loaded_titles: ReadSet = new ReadSet();

  constructor(id: string) {
    super(id);
    this.id_lg = id + "_lg";
  }

  async open(newsgroup: INewsGroup) {
    let from = 1;
    let to = newsgroup.max_id;
    let si = newsgroup.subsInfo;
    if (si && si.read.ranges.length > 0) {
      let r = si.read.ranges[0];
      if (r[0] == 1)
        from = Math.max(r[1] - 10, 1);
    }
    to = Math.min(from + 99, to);
    await this.load(newsgroup, from, to);
  }

  async load(newsgroup: INewsGroup, from: number, to: number) {
    let data = await get_json('/api/titles', { data: { newsgroup_id: newsgroup.id, from, to } });
    this.loaded_titles.clear().add_range(from, to);
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
    this.newsgroup = newsgroup;
    this.cur_article_id = null;
    this.redisplay(true);    // reset scroll
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
        s += this.thread_html(t, '');
      }
    } else {
      for (let id in this.titles) {
        let d = this.titles[id];
        s += this.title_html(d);
      }
    }
    if (!this.loaded_titles.includes(1))
      s = this.more_titles('backward') + s;
    if (this.newsgroup && !this.loaded_titles.includes(this.newsgroup.max_id))
      s += this.more_titles('forward');
    this.set_title();
    return this.toolbar.html() + div({ class: 'titles' }, div({ id: this.id_lg, class: 'nb-list-group' }, s));
  }

  more_titles(dir: 'forward' | 'backward'): string {
    let b = '';
    if (dir == 'backward') {
      let first = this.loaded_titles.first();
      if (first) {
        if (first > 1) {
          if (first > 101)
            b += button({ from: first - 100, to: first - 1, 'html-i18n': 'load-previous-100-titles' });
          b += button({ from: 1, to: first - 1, 'html-i18n': 'load-all-previous-titles' });
        }
      }
    }
    if (dir == 'forward') {
      let last = this.loaded_titles.last();
      if (last && this.newsgroup) {
        let max_id = this.newsgroup.max_id;
        let left = max_id - last;
        if (left > 0) {
          if (left > 100)
            b += button({ from: last + 1, to: last + 100, 'html-i18n': 'load-next-100-titles' });
          b += button({ from: last + 1, to: max_id, dir, 'html-i18n': 'load-all-subsequent-titles' });
        }
      }
    }
    if (b == '')
      return '';
    else
      return div({ class: 'more-titles' }, b);
  }

  redisplay(resetScroll: boolean = false) {
    let scroll = $(`#${this.id} .titles`).scrollTop();
    $('#' + this.id).html(this.inner_html());
    this.bind();
    if (!resetScroll)
      $(`#${this.id} .titles`).scrollTop(scroll || 0);
  }

  thread_html(t: ITitle, rule1: string = '', rule2: string = '') {
    let s = this.title_html(t, rule1);
    if (t.children) {
      for (let i = 0; i < t.children.length; i++) {
        let r1 = rule2 + (i < t.children.length - 1 ? '┣' : '┗');
        let r2 = rule2 + (i < t.children.length - 1 ? '┃' : '  ');
        s += this.thread_html(t.children[i], r1, r2);
      }
    }
    return s;
  }

  title_html(d: ITitle, rule: string = '') {
    let opt = { article_id: d.article_id };
    let c: string[] = ['title-contextmenu'];
    let si = this.newsgroup?.subsInfo;
    if (si && si.read.includes(d.article_id))
      c.push('read');
    if (this.cur_article_id == d.article_id)
      c.push('active');
    if (c.length > 0) opt['class'] = c.join(' ');
    let s = button(opt,
      div({ class: 'article-id' }, String(d.article_id)),
      div({ class: 'article-from', title: d.disp_name }, escape_html(d.disp_name)),
      div({ class: 'article-time' }, d.date),
      div({ class: 'article-rule' }, rule),
      div({ class: 'article-title' }, escape_html(d.title))
    );
    return s;
  }


  bind() {
    super.bind();
    $(`#${this.id_lg} >button`).on('click', ev => {
      let target = ev.currentTarget;
      let article_id: number = target.attributes['article_id'].value;
      this.select_article(article_id);
      if (this.newsgroup && this.clickCb) {
        this.clickCb(this.newsgroup.id, article_id);
      }
    });
    $(`#${this.id} .more-titles button`).on('click', async e => {
      let elem = e.currentTarget;
      let from = elem.attributes['from'].value || "";
      let to = elem.attributes['to'].value || "";
      if (this.newsgroup) {
        let rs = this.loaded_titles;
        rs.add_range(from, to);
        await this.load(this.newsgroup, rs.first() || 1, rs.last() || this.newsgroup.max_id);
        window.nnsbbs.redisplay();
      }
    })
  }

  select_article(id: number) {
    const scroller = `#${this.id} .titles`;
    const scrollee = scroller + ' >div';
    const line = scrollee + ` >button[article_id=${id}]`;
    $(scrollee + ' >button').removeClass('active');
    $(line).addClass('active');
    this.cur_article_id = id;
    let y = $(line).position().top;
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
    $('#' + this.id).html(this.inner_html());
    this.bind();
  }

  set_title() {
    let s = "";
    if (this.newsgroup) {
      let max_id = this.newsgroup.max_id;
      let cUnread = max_id;
      let si = this.newsgroup.subsInfo;
      if (si) cUnread = Math.max(cUnread - si.read.count(), 0);

      s += span({ class: 'newsgroup-name' }, this.newsgroup.name);
      s += span({ class: 'number-of-articles' }, '(',
        span({ 'title-i18n': 'unread-articles' }, cUnread), '/',
        span({ 'title-i18n': 'total-articles' }, max_id), ')');
      s += span({ class: 'subscription' }, '(',
        span({ 'html-i18n': si && si.subscribe ? 'subscribe' : 'unsubscribe' }),
        ')');
      s += span({ class: 'disp-mode' },
        '[',
        span({ 'html-i18n': this.bDispTherad ? 'thread-display' : 'time-order-display' }),
        ']');
      s += span({ class: 'loaded-titles' }, 'Loaded: ', span(this.loaded_titles.toString()))
    } else {
      s = "no-newsgroup";
    }
    this.toolbar.title = s;
  }

  scrollToPrevUnread(bFromBottom: boolean = false): boolean {
    let cur: HTMLElement;
    if (this.cur_article_id && !bFromBottom) {
      cur = $(`#${this.id} .nb-list-group button[article_id=${this.cur_article_id}]`)[0];
      cur = cur.previousSibling as HTMLElement;
    } else {
      let n = $(`#${this.id} .nb-list-group >button`);
      if (n.length > 0)
        cur = n[n.length - 1];
      else {
        return false;
      }
    }
    while (cur && cur.classList.contains('read'))
      cur = cur.previousSibling as HTMLElement;

    if (cur) {
      let id = cur.attributes['article_id'].value;
      this.select_article(id);
      return true;
    } else {
      return false;
    }
  }

  scrollToNextUnread(bFromTop: boolean = false): boolean {
    let cur: HTMLElement;
    if (this.cur_article_id && !bFromTop) {
      cur = $(`#${this.id} .nb-list-group button[article_id=${this.cur_article_id}]`)[0];
      cur = cur.nextElementSibling as HTMLElement;
    } else {
      let n = $(`#${this.id} .nb-list-group >button`);
      if (n.length == 0)
        return false;
      cur = n[0];
    }
    while (cur && cur.classList.contains('read'))
      cur = cur.nextElementSibling as HTMLElement;

    if (cur) {
      let id = cur.attributes['article_id'].value;
      this.select_article(id);
      return true;
    } else {
      return false;
    }
  }
}