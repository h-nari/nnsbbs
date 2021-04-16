import { get_json } from "./util";
import { div, button, span, input } from "./tag";
import { Btn, ToolBar } from "./toolbar";
import { Pane, ToolbarPane } from './pane';
import { ReadSet } from "./readSet";

export interface INewsGroup {
  id: number;
  name: string;
  comment: string;
  max_id: number;
  subsInfo: ISubsInfo | null;
};

// 購読情報：ニュースグループごとの購読、既読情報
export interface ISubsInfo {
  subscribe: boolean;
  read: ReadSet;
};
// ISubsInfoのjson表現
interface ISubsJson {
  subscribe: boolean;
  read: string;
};

export class NewsGroupsPane extends ToolbarPane {
  public subsInfo: { [name: string]: ISubsInfo } = {};
  public bShowAll: boolean = false;

  private id_lg: string;      // list-group id
  private newsgroups: INewsGroup[] = [];
  private clickCb: ((newsgroup: INewsGroup) => void) | null = null;
  private savedSubsString: string = "";
  private cur_newsgroup: INewsGroup | null = null;

  constructor(id: string) {
    super(id);
    this.id_lg = id + "_lg";
    this.toolbar.title = 'NewsGroup';

    setInterval(() => {
      this.saveSubsInfo();
    }, 5000);
  }

  setNewsgroups(data: INewsGroup[]) {
    this.newsgroups = data;
    if (this.subsInfo) {
      for (let ng of data) {
        ng.subsInfo = this.subsInfo[ng.name];
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
      let si = this.subsInfo[d.name];
      if ((!si || !si.subscribe) && !this.bShowAll) continue;   // 非購読ニュースグループを表示しない
      if (!si) si = { subscribe: false, read: new ReadSet() };
      let unread = d.max_id;
      let c = "";
      let opt = { type: 'checkbox', class: 'newsgroup-check', title: 'ニュースグループを購読' };
      if (si.subscribe) opt['checked'] = 1;
      c += input(opt);
      c += span({ class: 'newsgroup-name' }, d.name);
      if (si)
        unread = d.max_id - si.read.count();
      c += span({ class: 'newsgroup-status' },
        '(', span({ class: 'unread', title: '未読記事数' }, unread,),
        '/', span({ class: 'max-id', title: '総記事数' }, d.max_id), ')');
      let opt2 = { class: 'newsgroup-line', 'newsgroup-name': d.name, 'newsgroup-id': d.id };
      if (this.cur_newsgroup && this.cur_newsgroup.name == d.name)
        opt2.class += " active"
      if (si.subscribe) opt2.class += " subscribe";
      s += button(opt2, c);
    }

    return super.html() +
      div({ class: 'newsgroup' },
        div({ id: this.id_lg, class: 'nb-list-group' }, s));
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
        let newsgroup = parent.attributes['newsgroup-name'].value;
        if (!this.subsInfo[newsgroup])
          this.subsInfo[newsgroup] = { subscribe: false, read: new ReadSet() };
        let subscribe = $(target).is(':checked');
        this.subsInfo[newsgroup].subscribe = subscribe;
        if (subscribe)
          $(parent).addClass('subscribe');
        else
          $(parent).removeClass('subscribe');
      }
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
    const line = scrollee + ` >button[newsgroup-id=${newsgroup.id}]`;
    $(scrollee + ' >button').removeClass('active');
    if ($(line).length < 1) {
      console.log('newsgroup:', newsgroup.name, 'id:', newsgroup.id, ' not found');
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
      if (ng.name == name) return ng;
    }
    return null;
  }

  // 購読情報を読み込む
  loadSubsInfo(json_data: string | null = null) {
    console.log('loadSubsInfo');
    if (!json_data)
      json_data = localStorage.getItem('nnsbbsSubsInfo');
    if (json_data) {
      let data = JSON.parse(json_data) as { [n: string]: ISubsJson };
      let subsInfo: { [key: string]: ISubsInfo } = {};
      for (let ng in data) {
        let s = data[ng]
        subsInfo[ng] = {
          subscribe: s.subscribe,
          read: new ReadSet(s.read)
        };
      }
      this.subsInfo = subsInfo;
      this.savedSubsString = json_data;
      for (let ng of this.newsgroups) {
        console.log(ng.name, 'subsinfo:', subsInfo[ng.name]);
        ng.subsInfo = subsInfo[ng.name];
      }
    }
  }
  // 購読情報を保存する
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

  getSubsInfo(newsgroup: string): ISubsInfo {
    let si = this.subsInfo[newsgroup];
    if (!si)
      this.subsInfo[newsgroup] = si = { subscribe: false, read: new ReadSet() };
    return si;
  }

  read_all(newsgroup: string, last: number = 0) {
    let d = this.name2newsgroup(newsgroup);
    if (!d) throw new Error(`newsgroup:${newsgroup} は存在しません`);
    let si = this.getSubsInfo(newsgroup)
    si.read.clear();
    si.read.add_range(1, d.max_id - last);
    this.redisplay();
  }

  unread_all(newsgroup: string) {
    let d = this.name2newsgroup(newsgroup);
    if (!d) throw new Error(`newsgroup:${newsgroup} は存在しません`);
    let si = this.getSubsInfo(newsgroup)
    si.read.clear();
    this.redisplay();
  }

  scrollToNextSubscribedNewsgroup(bFromTop: boolean = false): boolean {
    let cur: HTMLElement;
    if (this.cur_newsgroup && !bFromTop) {
      cur = $(`#${this.id} .nb-list-group button[newsgroup-id=${this.cur_newsgroup.id}]`)[0];
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
