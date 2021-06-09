import { escape_html, make_rev_id, set_i18n, split_rev_id } from "./util";
import { div, button, span, icon } from "./tag";
import { ToolbarPane } from "./pane";
import { ReadSet } from "./readSet";
import { INewsGroup } from "./newsgroup";
import NnsBbs from "./nnsbbs";
import { api_titles, ITitle } from "./dbif";

export class TitlesPane extends ToolbarPane {
  private id_lg: string;
  private id2title: { [key: string]: ITitle } = {};
  private titles: ITitle[] = [];
  private threads: ITitle[] = [];
  private scroller = `#${this.id} .titles`;
  private scrollee = this.scroller + ' >div';

  public bDispTherad: boolean = true;
  public newsgroup: INewsGroup | undefined;
  public cur_rev_id: string | undefined;
  public clickCb: ((newsgroup_id: string, rev_id: string) => void) | undefined;
  public loaded_titles: ReadSet = new ReadSet();

  constructor(id: string, parent: NnsBbs) {
    super(id, parent);
    this.id_lg = id + "_lg";
  }

  cur_title() {
    if (this.cur_rev_id) return this.id2title[this.cur_rev_id];
    else return undefined;
  }

  async open(newsgroup: INewsGroup) {
    let from = 1;
    let to = newsgroup.n.max_id;
    let si = newsgroup.subsInfo;
    if (si && si.read.ranges.length > 0) {
      let r = si.read.ranges[0];
      if (r[0] == 1)
        from = Math.max(r[1] - 10, 1);
    }
    to = Math.min(from + 99, to);
    await this.load(newsgroup, from, to);
    this.show();
  }

  async load(newsgroup: INewsGroup, from: number, to: number, bClear: boolean = true) {
    let data = await api_titles(newsgroup.n.id, from, to, this.parent.user.setting.d.showDeletedArticle);
    if (bClear) {
      this.loaded_titles.clear();
      this.id2title = {}
      this.titles = [];
      this.threads = [];
      this.cur_rev_id = undefined;
    }
    for (let d of data) {
      if (this.loaded_titles.includes(Number(d.article_id))) continue;
      let rev_id = make_rev_id(d.article_id, d.rev);
      this.id2title[rev_id] = d;
      this.titles.push(d);
      if (d.rev > 0) {
        let rev0_id = make_rev_id(d.article_id, d.rev - 1);
        let rev0 = this.id2title[rev0_id];
        if (rev0) {
          rev0.revised = d;
          continue;
        }
      }
      let reply_rev_id = make_rev_id(d.reply_to, d.reply_rev);
      let parent = this.id2title[reply_rev_id];
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(d);
      } else {
        this.threads.push(d);
      }
    }
    this.titles.sort((a, b) => Number(a.article_id) - Number(b.article_id));
    this.threads.sort((a, b) => Number(a.article_id) - Number(b.article_id));
    this.newsgroup = newsgroup;
    this.loaded_titles.add_range(from, to);
    this.redisplay(bClear);
  }

  html(): string {
    return div({ id: this.id }, this.inner_html());
  }

  inner_html(): string {
    let s = "";
    if (this.bDispTherad && this.threads) {
      for (let t of this.threads) {
        s += this.thread_html(t, ' ', ' ');
      }
    } else {
      for (let id in this.titles) {
        let d = this.titles[id];
        s += this.title_html(d);
      }
    }
    if (!this.loaded_titles.includes(1))
      s = this.more_titles('backward') + s;
    if (this.newsgroup && !this.loaded_titles.includes(this.newsgroup.n.max_id))
      s += this.more_titles('forward');
    this.set_title();
    return this.toolbar.html() + div({ class: 'titles' }, div({ id: this.id_lg, class: 'title-list' }, s));
  }

  more_titles(dir: 'forward' | 'backward'): string {
    let b = '';
    if (dir == 'backward') {
      let first = this.loaded_titles.first();
      if (first) {
        if (first > 1) {
          if (first > 101)
            b += button({ from: first - 100, to: first - 1 }, this.t('load-previous-100-titles'));
          b += button({ from: 1, to: first - 1 }, this.t('load-all-previous-titles'));
        }
      }
    }
    if (dir == 'forward') {
      let last = this.loaded_titles.last();
      if (last && this.newsgroup) {
        let max_id = this.newsgroup.n.max_id;
        let left = max_id - last;
        if (left > 0) {
          if (left > 100)
            b += button({ from: last + 1, to: last + 100 }, this.t('load-next-100-titles'));
          b += button({ from: last + 1, to: max_id, dir }, this.t('load-all-subsequent-titles'));
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
    if (t.revised && (!t.children || t.children.length == 0))
      return this.thread_html(t.revised, rule1, rule2);
    let s = this.title_html(t, rule1);
    if (t.children) {
      for (let i = 0; i < t.children.length; i++) {
        let r1 = rule2 + (i < t.children.length - 1 || t.revised ? '┣' : '┗');
        let r2 = rule2 + (i < t.children.length - 1 || t.revised ? '┃' : '  ');
        s += this.thread_html(t.children[i], r1, r2);
      }
    }
    if (t.revised)
      s += this.thread_html(t.revised, rule2 + '┗', rule2 + '  ');
    return s;
  }

  title_html(d: ITitle, rule: string = ''): string {
    let rev_id = make_rev_id(d.article_id, d.rev);
    let opt = { rev_id };
    let c: string[] = ['title-contextmenu'];
    let si = this.newsgroup?.subsInfo;
    if (si && si.read.includes(Number(d.article_id)))
      c.push('read');
    if (this.cur_rev_id == rev_id)
      c.push('active');
    if (d.bDeleted)
      c.push('deleted');
    if (c.length > 0) opt['class'] = c.join(' ');
    let reactions = '';
    let reaction_type = this.parent.reaction_type;
    if (d.reaction && reaction_type) {
      for (let t of Object.keys(d.reaction).sort()) {
        let r = reaction_type[t];
        reactions += div({ class: 'reaction ' + r.name, 'title-i18n': r.name }, icon(r.icon, 'icon') + d.reaction[t]);
      }
    }
    let s = div(opt,
      div({ class: 'article-rule' }, rule),
      div({ class: 'article-id' }, make_rev_id(d.article_id, d.rev)),
      div({ class: 'article-from', user_id: d.user_id }, escape_html(d.disp_name)),
      div({ class: 'article-time' }, d.date),
      div({ class: 'article-title' }, escape_html(d.title)),
      reactions
    );
    return s;
  }

  bind() {
    super.bind();
    $(`#${this.id_lg} >div`).on('click', async ev => {
      let target = ev.currentTarget;
      if (target.attributes['rev_id']) {
        let rev_id: string = target.attributes['rev_id'].value;
        await this.select_article(rev_id);
        if (this.newsgroup && this.clickCb) {
          this.clickCb(this.newsgroup.n.id, rev_id);
        }
      }
    });
    $(`#${this.id} .more-titles button`).on('click', async e => {
      let elem = e.currentTarget;
      let from = (elem.attributes['from'].value || 1) as number;
      let to = (elem.attributes['to'].value || 1000) as number;
      if (this.newsgroup) {
        let scroll = $(this.scroller).scrollTop() || 0;
        await this.load(this.newsgroup, from, to, false);
        $(this.scroller).scrollTop(scroll);
        set_i18n();
      }
    })

    /*    $(`#${this.id_lg} >div .article-from`).on('click', e => { */
    /*      let user_id = e.currentTarget.attributes['user_id'].value; */
    /*      this.parent.user.show_profile(user_id); */
    /*      e.preventDefault(); */
    /*      e.stopPropagation(); */
    /*    }); */
  }

  async select_article(rev_id: string) {
    const line = this.scrollee + ` >div[rev_id="${rev_id}"]`;
    if (this.cur_rev_id != rev_id) {

      if ($(line).length == 0 && this.newsgroup) {
        let r = split_rev_id(rev_id);
        let id_num = parseInt(r.article_id);
        await this.load(this.newsgroup, Math.max(1, id_num - 50), Math.min(id_num + 50, this.newsgroup.n.max_id))
      }
      $(this.scrollee + ' >div').removeClass('active');
      $(line).addClass('active');
      this.cur_rev_id = rev_id;
    }
  }

  // Scroll to show the selected line.
  scroll_to_show_selected_line(bCenter: boolean = false) {
    const line = this.scrollee + ' >div.active';
    if ($(line).length != 1)
      return;
    let y = $(line).position().top;
    let sy = $(this.scroller).scrollTop() || 0;
    let sh = $(this.scroller).height() || 0;
    let lh = $(line).height() || 0;
    if (bCenter)
      $(this.scroller).scrollTop(sy + y - sh / 2);
    else if (y < 0)
      $(this.scroller).scrollTop(sy + y - 10);
    else if (y + lh > sh)
      $(this.scroller).scrollTop(sy + y - sh + lh);
  }

  disp_thread(bThread: boolean) {
    this.bDispTherad = bThread;
    this.redisplay(true);
  }

  set_title() {
    let s = "";
    if (this.newsgroup) {
      let max_id = this.newsgroup.n.max_id;
      let cUnread = max_id;
      let si = this.newsgroup.subsInfo;
      if (si) cUnread = Math.max(cUnread - si.read.count(), 0);

      s += span({ class: 'newsgroup-name' }, this.newsgroup.n.name);
      s += span({ class: 'number-of-articles' }, '(',
        span({ 'title-i18n': 'unread-articles' }, cUnread), '/',
        span({ 'title-i18n': 'total-articles' }, max_id), ')');
      s += span({ class: 'subscription' }, '(',
        span(this.t(si && si.subscribe ? 'subscribe' : 'unsubscribe')),
        ')');
      s += span({ class: 'disp-mode' },
        '[',
        span(this.t(this.bDispTherad ? 'thread-display' : 'time-order-display')),
        ']');
      s += span({ class: 'loaded-titles' }, 'Loaded: ', span(this.loaded_titles.toString()))
    } else {
      s = "no-newsgroup";
    }
    this.toolbar.title = s;
  }

  scrollToPrevUnread(bFromBottom: boolean = false): boolean {
    let cur: HTMLElement;
    if (this.cur_rev_id && !bFromBottom) {
      cur = $(`#${this.id} .title-list [rev_id="${this.cur_rev_id}"]`)[0];
      cur = cur.previousSibling as HTMLElement;
    } else {
      let n = $(`#${this.id} .title-list >div[rev_id]`);
      if (n.length > 0)
        cur = n[n.length - 1];
      else {
        return false;
      }
    }
    while (cur && cur.classList.contains('read'))
      cur = cur.previousSibling as HTMLElement;

    if (cur && cur.tagName == 'DIV' && cur.attributes['rev_id']) {
      let rev_id = cur.attributes['rev_id'].value;
      this.select_article(rev_id);
      return true;
    } else {
      return false;
    }
  }

  async scrollToNextUnread(bFromTop: boolean = false): Promise<boolean> {
    if (!this.newsgroup) return false;
    let cur: HTMLElement;
    let rev_id: string = '';
    if (this.cur_rev_id && !bFromTop) {
      rev_id = this.cur_rev_id;
      cur = $(`#${this.id} .title-list [rev_id="${this.cur_rev_id}"]`)[0];
      cur = cur.nextElementSibling as HTMLElement;
    } else {
      let n = $(`#${this.id} .title-list >div[rev_id]`);
      if (n.length == 0)
        return false;
      cur = n[0];
    }
    while (cur && cur.classList.contains('read')) {
      rev_id = cur.attributes['rev_id'].value || '';
      cur = cur.nextElementSibling as HTMLElement;
    }
    if (cur && cur.tagName == 'DIV' && cur.attributes['rev_id']) {
      rev_id = cur.attributes['rev_id'].value;
      await this.select_article(rev_id);
      return true;
    }

    let article_id = Number(split_rev_id(rev_id).article_id);
    if (this.newsgroup.subsInfo) {
      let readset = this.newsgroup.subsInfo.read;
      while (readset.includes(article_id)) article_id++;
      if (article_id > this.newsgroup.n.max_id)
        return false;
    }

    if (cur && $(cur).hasClass('more-titles')) {
      let btn = cur.children[0];
      let from = Number(btn.attributes['from'].value || '0');
      let to = Number(btn.attributes['to'].value || '0');

      if (article_id >= from && article_id <= to) {
        await this.load(this.newsgroup, Number(from), Number(to), false);
        cur = $(`#${this.id} .title-list [rev_id="${rev_id}"]`)[0];
        if (!cur) throw new Error('unexpected-situation');
        while (cur && cur.classList.contains('read'))
          cur = cur.nextElementSibling as HTMLElement;
        if (cur && cur.tagName == 'DIV' && cur.attributes['rev_id']) {
          rev_id = cur.attributes['rev_id'].value;
          await this.select_article(rev_id);
          return true;
        }
      }
    }
    await this.select_article(make_rev_id(String(article_id), 0));
    return true;
  }

  update_subsInfo(rev_id: string) {
    let line = this.scrollee + ` [rev_id="${rev_id}"]`;
    $(line).addClass('read');
    this.set_title();
    this.toolbar.redisplay();
  }
}