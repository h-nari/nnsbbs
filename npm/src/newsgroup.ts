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
};

// 購読情報：ニュースグループごとの購読、既読情報
interface ISubsInfo {
  subscribe: boolean;
  read: ReadSet;
};
// ISubsInfoのjson表現
interface ISubsJson {
  subscribe: boolean;
  read: string;
};

export class NewsGroupsPane extends ToolbarPane {
  private id_lg: string;      // list-group id
  private data: INewsGroup[] = [];
  private clickCb: ((newsgroup_id: number) => void) | null = null;
  public subsInfo: { [name: string]: ISubsInfo } = {};
  private savedSubsString: string = "";

  constructor(id: string) {
    super(id);
    this.id_lg = id + "_lg";
    this.toolbar.title = 'NewsGroup';
    // this.toolbar.add_btn(new Btn({ icon: 'caret-right' }));
    // this.toolbar.add_btn(new Btn({ icon: 'caret-down-fill' }));
    // this.toolbar.add_btn(new Btn({ icon: 'gear-fill' }));
    // this.toolbar.add_btn(new Btn({ icon: 'x-square' }));
  }

  setData(data: INewsGroup[]) {
    this.data = data;
  }

  setClickCb(cb: (n: number) => void) {
    this.clickCb = cb;
  }

  html(): string {
    return div({ id: this.id }, this.inner_html());
  }

  inner_html(): string {
    let s = "";
    for (let d of this.data) {
      let si = this.subsInfo[d.name];
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
      let opt2 = { class: 'newsgroup-line', 'newsgroup-id': d.id, 'newsgroup-name': d.name };
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
      let ng_id = t.attributes['newsgroup-id'].value;
      if (this.clickCb) this.clickCb(ng_id);
    });
    $(`#${this.id_lg} .newsgroup-line .newsgroup-check`).on('change', ev => {
      console.log('change');
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
        console.log(newsgroup, subscribe);
        this.saveSubsInfo();
      }
    });
  }

  select_newsgroup(id: number) {
    $(`#${this.id_lg} >button`).removeClass('active');
    $(`#${this.id_lg} >button[newsgroup-id=${id}]`).addClass('active');
  }

  id2name(id: number): string | null {
    for (let ng of this.data) {
      if (ng.id == id) return ng.name;
    }
    return null;
  }

  name2id(name: string): number | null {
    for (let ng of this.data) {
      if (ng.name == name) return ng.id;
    }
    return null;
  }

  // 購読情報を読み込む
  loadSubsInfo(json_data: string | null = null) {
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
}
