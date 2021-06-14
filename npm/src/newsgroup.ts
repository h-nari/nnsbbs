import { div, button, span, input, tag, a } from "./tag";
import { ToolbarPane } from './pane';
import { ReadSet } from "./readSet";
import NnsBbs from "./nnsbbs";
import { TNewsgroup, api_session, api_profile_read, api_profile_write, api_subsInfo_read, ISubsHash, ISubsElem, api_subsInfo_write, api_newsgroup } from "./dbif";
import { NewsgroupTree } from "./newsgroupTree";
import { Menu } from "./menu";
import { set_i18n } from "./util";
const moment = require('moment');

export interface INewsGroup {
  n: TNewsgroup;
  subsInfo: ISubsInfo | null;
};

// Subscription information: 
export interface ISubsInfo {
  subscribe: boolean;
  read: ReadSet;
  update: boolean | undefined;
};
// Json expression of ISubsInfo
export interface ISubsJson {
  subscribe: boolean;
  read: string;
};

export class NewsgroupsPane extends ToolbarPane {
  public bShowAll: boolean = true;
  private id_lg: string;      // list-group id
  private newsgroups: INewsGroup[] = [];
  public clickCb: ((path: string) => void) | undefined;
  public showAllNewsgroupCb: (() => void) | undefined;
  public subsInfo: { [name: string]: ISubsInfo } = {};
  private savedSubsString: { [newsgroup_id: string]: string } = {};
  public root: NewsgroupTree = new NewsgroupTree(this, '', '');
  public curNode: NewsgroupTree | undefined;
  public menu: Menu;

  constructor(id: string, parent: NnsBbs) {
    super(id, parent);
    this.id_lg = id + "_lg";
    this.toolbar.title = 'NewsGroup';
    this.menu = new Menu({ icon: 'three-dots' });
    this.toolbar.add_menu(this.menu);
    this.menu.opt.action = (e, m) => {
      m.clear();
      m.add(new Menu({
        name: this.t('expand-all-hierarchies'),
        action: () => {
          this.root.forEach(n => { n.fold = false; });
          this.redisplay();
        }
      }));
      m.add(new Menu({
        name: this.t('collapse-all-hierarchies'),
        action: () => {
          this.root.forEach(n => { n.fold = true; });
          this.redisplay();
        }
      }));
      m.expand(e);
    };

    this.toolbar.add_menu(new Menu({
      icon: 'arrow-clockwise',
      explain: 'reload'
    }));

    if (false) {
      setInterval(() => {
        this.saveSubsInfo();
      }, 5000);
    }
  }

  setNewsgroups(data: TNewsgroup[]) {
    this.newsgroups = data.map(t => { return { n: t, subsInfo: null } });
    this.setSubsInfoIntoNewsgroup();
    let old_root = this.root;
    this.root = new NewsgroupTree(this, '', '');
    for (let n of this.newsgroups)
      this.root.allocNewsgroup(n.n.name, n);
    var list: NewsgroupTree[] = [];
    this.root.forEach(n => list.push(n));
    for (let i = 0; i < list.length; i++)
      list[i].next = i < list.length - 1 ? list[i + 1] : undefined;

    this.root.sumUp(n => n.calc());
    if (old_root.children.length > 0) {
      this.root.forEach(n => {
        let n0 = old_root.findNewsgroup(n.path);
        if (n0) n.fold = n0.fold;
      });
    }
  }

  setSubsInfoIntoNewsgroup() {
    if (this.subsInfo && this.newsgroups.length > 0) {
      for (let ng of this.newsgroups) {
        ng.subsInfo = this.subsInfo[ng.n.id];
        if (!ng.subsInfo) {
          ng.subsInfo = { subscribe: false, read: new ReadSet(), update: false };
          this.subsInfo[ng.n.id] = ng.subsInfo;
        }
      }
    }
  }

  html(): string {
    return div({ id: this.id }, this.inner_html());
  }

  inner_html(): string {
    let s = this.root.sub_html();
    let b: string;
    if (s.length > 0)
      b = div({ class: 'ng-tree' }, s);
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
    this.root.bind();
    set_i18n('#' + this.id);
  }

  async redisplay(bFromDB: boolean = false) {
    $('.tooltip').remove();
    if (bFromDB) {
      this.toolbar.title = this.t('newsgroup');
      await this.loadSubsInfo();
      let data = await api_newsgroup();
      this.setNewsgroups(data);
    }

    let scroll = $(`#${this.id} .newsgroup`).scrollTop();
    $('#' + this.id).html(this.inner_html());
    this.bind();
    $(`#${this.id} .newsgroup`).scrollTop(scroll || 0);
    if (this.curNode)
      this.select_newsgroup(this.curNode.path);
  }

  async select_newsgroup(path: string) {
    let node = this.root.findNewsgroup(path);
    if (node) {
      for (let n: NewsgroupTree | undefined = node.parent; n; n = n.parent)
        n.fold = false;

      if (this.curNode != node) {
        this.curNode = node;
        await this.redisplay();
      }

      const scroller = `#${this.id} .newsgroup`;
      const scrollee = scroller + " .ng-tree";
      const line = scrollee + ` .sub-tree[path="${path}"] .ng-node`;
      $(scrollee + ' .ng-node').removeClass('active');
      if ($(line).length < 1) {
        console.log('newsgroup:', path, ' not found');
        return;
      }
      $(line).addClass('active');
      let y = $(line).position().top;
      let sy = $(scroller).scrollTop() || 0;
      let sh = $(scroller).height() || 0;
      let lh = $(line).height() || 0;
      if (y < 0)
        $(scroller).scrollTop(sy + y - (sh - lh) / 2);
      else if (y + lh > sh)
        $(scroller).scrollTop(sy + y - (sh - lh) / 2);
    }
    return node;
  }


  name2newsgroup(name: string): INewsGroup | null {
    for (let ng of this.newsgroups)
      if (ng.n.name == name) return ng;
    return null;
  }


  clearSubsInfo() {
    this.subsInfo = {};
    this.savedSubsString = {};
    for (let ng of this.newsgroups)
      ng.subsInfo = null;
  }

  // Load subscription information
  async loadSubsInfo() {
    let h: ISubsHash = {};
    if (this.parent.user.user)
      h = await api_subsInfo_read(this.parent.user.user.id);
    this.clearSubsInfo();
    for (let newsgroup_id in h) {
      let v = h[newsgroup_id];
      let s = this.subsInfo[newsgroup_id] = {
        subscribe: v.subscribe != 0,
        read: new ReadSet(v.done),
        update: v.update ? v.update != 0 : false
      };
      this.savedSubsString[newsgroup_id] = JSON.stringify(s);
    }
    this.setSubsInfoIntoNewsgroup();
  }

  // Save your subscription information
  async saveSubsInfo(bForced: boolean = false) {
    let user = this.parent.user.user;
    if (!user) return;
    for (let nid in this.subsInfo) {
      let si = this.subsInfo[nid];
      let jsonStr = JSON.stringify(si);
      let savedStr = this.savedSubsString[nid];
      let saveData: ISubsElem[] = [];
      if (jsonStr != savedStr || bForced) {
        this.savedSubsString[nid] = jsonStr;
        saveData.push({
          newsgroup_id: nid,
          subscribe: si.subscribe ? 1 : 0,
          done: si.read.toString(),
          update: si.update ? 1 : 0
        });
        si.update = true;
      }
      if (saveData.length > 0)
        await api_subsInfo_write(user.id, saveData)
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

  scrollToNextSubscribedNewsgroup(bFromTop: boolean = false): boolean {
    let node: NewsgroupTree | undefined = this.curNode;
    if (!node || bFromTop) node = this.root;
    if (node) node = node.next;
    while (node && !node.hasArticles()) {
      node = node.next;
    }

    if (node) {
      this.select_newsgroup(node.path);
      return true;
    } else if (this.root.next)
      this.select_newsgroup(this.root.next.path);
    return false;
  }


  update_subsInfo(path: string) {
    let node = this.root.findNewsgroup(path);
    if (!node) throw new Error(`newsgroup ${path} not found.`);
    for (let n: NewsgroupTree | undefined = node; n; n = n.parent)
      n.calc();
  }
}
