import { div, button, span, input, tag } from "./tag";
import { ToolbarPane } from './pane';
import { ReadSet } from "./readSet";
import NnsBbs from "./nnsbbs";
import { TNewsgroup, api_session } from "./dbif";
const moment = require('moment');

export interface INewsGroup {
  n: TNewsgroup;
  subsInfo: ISubsInfo | null;
};

// Subscription information: 
export interface ISubsInfo {
  subscribe: boolean;
  read: ReadSet;
};
// Json expression of ISubsInfo
export interface ISubsJson {
  subscribe: boolean;
  read: string;
};

export class NewsGroupsPane extends ToolbarPane {
  public subsInfo: { [name: string]: ISubsInfo } | null = null;
  public bShowAll: boolean = false;

  private id_lg: string;      // list-group id
  private newsgroups: INewsGroup[] = [];
  private clickCb: ((newsgroup: INewsGroup) => void) | null = null;
  public showAllNewsgroupCb: (() => void) | null = null;
  private savedSubsString: string = "";
  private cur_newsgroup: INewsGroup | null = null;

  constructor(id: string, parent: NnsBbs) {
    super(id, parent);
    this.id_lg = id + "_lg";
    this.toolbar.title = 'NewsGroup';

    setInterval(() => {
      this.saveSubsInfo();
    }, 5000);
  }

  setNewsgroups(data: TNewsgroup[]) {
    this.newsgroups = data.map(t => { return { n: t, subsInfo: null } });
    this.setSubsInfoIntoNewsgroup();
  }

  setSubsInfoIntoNewsgroup() {
    if (this.subsInfo && this.newsgroups.length > 0) {
      for (let ng of this.newsgroups) {
        ng.subsInfo = this.subsInfo[ng.n.name];
        if (!ng.subsInfo) {
          ng.subsInfo = { subscribe: false, read: new ReadSet() };
          this.subsInfo[ng.n.name] = ng.subsInfo;
        }
      }
    }
  }

  setClickCb(cb: (n: INewsGroup) => void) {
    this.clickCb = cb;
  }

  html(): string {
    return div({ id: this.id }, this.inner_html());
  }

  inner_html(): string {
    let s = "";
    for (let d of this.newsgroups) {
      let si = d.subsInfo;
      if (si?.subscribe || this.bShowAll) {
        let unread = d.n.max_id;
        let c = "";
        let opt = { type: 'checkbox', class: 'newsgroup-check', title: 'subscribe-newsgroup' };
        if (si && si.subscribe) opt['checked'] = null;
        c += input(opt);
        c += span({ class: 'newsgroup-name' }, d.n.name);
        if (si)
          unread = Math.max(d.n.max_id - si.read.count(), 0);
        c += span({ class: 'newsgroup-status' },
          '(', span({ class: 'unread', 'title-i18n': 'unread-articles' }, unread,),
          '/', span({ class: 'max-id', 'title-i18n': 'total-articles' }, d.n.max_id), ')');
        let m = moment(d.n.posted_at);
        c += span({ class: 'posted-at' }, this.t('last-post'), ': ', m.format('YYYY/MM/DD HH:mm:ss'));
        let opt2 = { class: 'newsgroup-line', 'newsgroup-name': d.n.name, 'newsgroup-id': d.n.id };
        if (this.cur_newsgroup && this.cur_newsgroup.n.name == d.n.name)
          opt2.class += " active"
        if (si?.subscribe) opt2.class += " subscribe";
        s += button(opt2, c);
      }
    }

    let b: string;
    if (s.length > 0)
      b = div({ id: this.id_lg, class: 'nb-list-group' }, s);
    else {
      b = div({ class: 'no-newsgroup' },
        div(
          div({ 'html-i18n': 'no-subscribed-newsgroup' }),
          div(button({
            id: this.id + '_showall',
            class: 'btn btn-primary',
            type: 'button',
            'html-i18n': 'show-all-newsgroups'
          }))));
    }

    return super.html() +
      div({ class: 'newsgroup' }, b);
  }
  bind() {
    super.bind();
    $(`#${this.id_lg} >button`).on('click', ev => {
      let t = ev.currentTarget;
      let ng_name = t.attributes['newsgroup-name'].value;
      if (this.clickCb) this.clickCb(ng_name);
    });
    $(`#${this.id_lg} .newsgroup-line .newsgroup-check`).on('change', ev => {
      let target = ev.currentTarget;
      let parent = target.parentElement;
      if (parent) {
        let name = parent.attributes['newsgroup-name'].value;
        let newsgroup = this.name2newsgroup(name);
        if (!newsgroup)
          throw new Error('newsgroup ' + name + ' not found');
        let subscribe = $(target).is(':checked');
        if (newsgroup.subsInfo)
          newsgroup.subsInfo.subscribe = subscribe;
        if (subscribe)
          $(parent).addClass('subscribe');
        else
          $(parent).removeClass('subscribe');
      }
    });
    $('#' + this.id + '_showall').on('click', () => {
      if (this.showAllNewsgroupCb)
        this.showAllNewsgroupCb();
    });
  }

  redisplay() {
    let scroll = $(`#${this.id} .newsgroup`).scrollTop();
    $('#' + this.id).html(this.inner_html());
    this.bind();
    $(`#${this.id} .newsgroup`).scrollTop(scroll || 0);
    if (this.cur_newsgroup)
      this.select_newsgroup(this.cur_newsgroup);
  }

  select_newsgroup(newsgroup: INewsGroup) {
    const scroller = `#${this.id} .newsgroup`;
    const scrollee = scroller + " >div";
    const line = scrollee + ` >button[newsgroup-id=${newsgroup.n.id}]`;
    $(scrollee + ' >button').removeClass('active');
    if ($(line).length < 1) {
      console.log('newsgroup:', newsgroup.n.name, 'id:', newsgroup.n.id, ' not found');
      return;
    }
    $(line).addClass('active');
    let y = $(line).position().top;
    let sy = $(scroller).scrollTop() || 0;
    let sh = $(scroller).height() || 0;
    let lh = $(line).height() || 0;
    if (y < 0)
      $(scroller).scrollTop(sy + y);
    else if (y + lh > sh)
      $(scroller).scrollTop(sy + y);

    this.cur_newsgroup = newsgroup;
  }

  name2newsgroup(name: string): INewsGroup | null {
    for (let ng of this.newsgroups) {
      if (ng.n.name == name) return ng;
    }
    return null;
  }

  // Load subscription information
  // TODO: DBからロード
  async loadSubsInfo() {
    let s = await api_session();

    let json_data = localStorage.getItem('nnsbbsSubsInfo');
    if (json_data) {
      let data = JSON.parse(json_data) as { [n: string]: ISubsJson };
      let subsInfo: { [key: string]: ISubsInfo } = {};
      for (let k in data)
        subsInfo[k] = { subscribe: data[k].subscribe, read: new ReadSet(data[k].read) };
      this.subsInfo = subsInfo;
      this.savedSubsString = json_data;
      this.setSubsInfoIntoNewsgroup();
    }
  }
  // Save your subscription information
  //TODO DBへセーブ
  saveSubsInfo(bForced: boolean = false) {
    let subsJson: { [key: string]: ISubsJson } = {};
    for (let ng in this.subsInfo) {
      let s = this.subsInfo[ng];
      subsJson[ng] = {
        subscribe: s.subscribe,
        read: s.read.toString()
      };
    }
    let str = JSON.stringify(subsJson, null, 2);
    if (bForced || str != this.savedSubsString) {
      localStorage.setItem('nnsbbsSubsInfo', str);
      this.savedSubsString = str;
    }
  }

  getSubsInfo(name: string): ISubsInfo | null {
    let ng = this.name2newsgroup(name);
    if (ng)
      return ng.subsInfo;
    else {
      console.log(`newsgroup: ${name} not found`);
      return null;
    }
  }

  read_all(newsgroup: string, last: number = 0) {
    let d = this.name2newsgroup(newsgroup);
    if (!d) throw new Error(`newsgroup:${newsgroup} は存在しません`);
    let si = this.getSubsInfo(newsgroup)
    if (si) {
      si.read.clear();
      si.read.add_range(1, d.n.max_id - last);
    }
  }

  unread_all(newsgroup: string) {
    let d = this.name2newsgroup(newsgroup);
    if (!d) throw new Error(`newsgroup:${newsgroup} は存在しません`);
    let si = this.getSubsInfo(newsgroup)
    if (si) si.read.clear();
  }

  scrollToNextSubscribedNewsgroup(bFromTop: boolean = false): boolean {
    let cur: HTMLElement;
    if (this.cur_newsgroup && !bFromTop) {
      cur = $(`#${this.id} .nb-list-group button[newsgroup-id=${this.cur_newsgroup.n.id}]`)[0];
      cur = cur.nextSibling as HTMLElement;
    } else {
      let n = $(`#${this.id} .nb-list-group button`);
      if (n.length > 0) cur = n[0]
      else return false;
    }
    while (cur && !cur.classList.contains('subscribe'))
      cur = cur.nextSibling as HTMLElement;

    if (cur) {
      let name = cur.attributes['newsgroup-name'].value;
      let ng = this.name2newsgroup(name);
      if (ng) {
        this.select_newsgroup(ng);
        return true;
      }
    }
    return false;
  }
}
