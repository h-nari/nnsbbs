import { div, button, span } from "./tag";
import { ToolbarPane } from './pane';
import { ReadSet } from "./readSet";
import NnsBbs from "./nnsbbs";
import { TNewsgroup, api_subsInfo_read, ISubsHash, ISubsElem, api_subsInfo_write, api_newsgroup, api_theme_list } from "./dbif";
import { NewsgroupTree } from "./newsgroupTree";
import { Menu } from "./menu";
import { set_i18n } from "./util";
import { SubsInfo } from "./subsInfo";
import i18next from "i18next";
const moment = require('moment');

export interface INewsGroup {
  n: TNewsgroup;
  subsInfo: SubsInfo;
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
  private newsgroups: INewsGroup[] = [];
  public clickCb: ((path: string) => void) | undefined;
  public showAllNewsgroupCb: (() => void) | undefined;
  private savedSubsString: { [newsgroup_id: string]: string } = {};
  public root: NewsgroupTree = new NewsgroupTree(this, '', '');
  public curNode: NewsgroupTree | undefined;
  public menu: Menu;
  public nologin_subsInfo = false;

  constructor(id: string, parent: NnsBbs) {
    super(id, parent);
    this.toolbar.title = 'NewsGroup';
    this.menu = new Menu({ icon: 'three-dots' });
    this.toolbar.add_menu(this.menu);
    this.menu.opt.action = (e, m) => {
      m.clear();
      m.add({
        name: this.t('show-unsubscribed-newsgroups'),
        with_check: true,
        checked: this.bShowAll,
        action: () => { this.bShowAll = !this.bShowAll; this.redisplay(); }
      }).addSeparator();

      m.add({
        name: this.t('fold-all'),
        action: () => {
          this.root.forEach(n => { n.fold = true; });
          this.redisplay();
        }
      }).add({
        name: this.t('unfold-all'),
        action: () => {
          this.root.forEach(n => { n.fold = false; });
          this.redisplay();
        }
      });

      if (this.parent.user.user) {
        m.addSeparator();
        m.add({
          name: i18next.t('subscribe-all'),
          action: async (e, m) => { this.root.set_tree_subscribe(true); }
        }).add({
          name: i18next.t('unsubscribe-all'),
          action: async (e, m) => { this.root.set_tree_subscribe(false); }
        });

        m.addSeparator();
        m.add({
          name: i18next.t('read-info-management'),
          action: (e, m) => { this.root.read_info_dlg() }
        });
      }
      m.expand(e);
    };

    this.toolbar.add_menu({
      icon: 'arrow-clockwise',
      explain: 'reload',
      link: window.nnsbbs_baseURL
    });
  }

  setNewsgroups(data: TNewsgroup[]) {
    this.newsgroups = data.map(t => { return { n: t, subsInfo: new SubsInfo(t.id, t.max_id, t.deleted_articles) } });
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
            class: 'btn btn-primary btn-show-all-newsgroup',
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
    $('.btn-show-all-newsgroup').on('click', () => {
      this.bShowAll = true;
      this.redisplay();
    });
    set_i18n('#' + this.id);
  }

  async redisplay(bFromDB: boolean = false) {
    $('.tooltip').remove();

    if (bFromDB) {
      let data = await api_newsgroup();
      this.setNewsgroups(data);
      await this.loadSubsInfo();
    }
    this.toolbar.title = this.t('newsgroup');
    if (this.parent.user.user) {
      this.toolbar.title += span({ class: 'num-subscribed' },
        span({ class: 'title' }, this.t('num-subscribed')),
        span({ class: 'num' }, this.root.subscribed_ng_num),
        '/',
        span({ class: 'total' }, this.root.ng_num)
      );
      this.toolbar.title += span({ class: 'num-article' },
        span({ class: 'title' }, this.t('num-unread')),
        span({ class: 'unread' }, this.root.unread_article_num));
    }
    this.toolbar.title += span({ style: 'flex-grow: 10' });
    this.toolbar.title += span({ class: 'posted-at' },
      span({ class: 'title' }, this.t('posted-at')),
      span({ class: 'value' }, this.root.posted_at));

    let scroll = $(`#${this.id} .newsgroup`).scrollTop();
    $('#' + this.id).html(this.inner_html());
    this.bind();
    $(`#${this.id} .newsgroup`).scrollTop(scroll || 0);
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
      if ($(line).length > 0) {
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
    }
    return node;
  }


  name2newsgroup(name: string): INewsGroup | null {
    for (let ng of this.newsgroups)
      if (ng.n.name == name) return ng;
    return null;
  }


  clearSubsInfo() {
    this.savedSubsString = {};
    for (let ng of this.newsgroups)
      ng.subsInfo = new SubsInfo(ng.n.id, ng.n.max_id, ng.n.deleted_articles);
  }

  // Load subscription information
  async loadSubsInfo() {
    let h: ISubsHash = {};
    if (this.parent.user.user)
      h = await api_subsInfo_read(this.parent.user.user.id);
    else if (this.nologin_subsInfo) {
      let str = localStorage.getItem('nnsbbs_subsInfo');
      if (str) h = JSON.parse(str)
    }
    this.clearSubsInfo();
    for (let ng of this.newsgroups) {
      let nid = ng.n.id;
      if (nid in h)
        ng.subsInfo = new SubsInfo(nid, ng.n.max_id, ng.n.deleted_articles, h[nid]);
      this.savedSubsString[nid] = JSON.stringify(ng.subsInfo.subsElem());
    }
    this.root.sumUp(n => n.calc());
  }

  // Save your subscription information
  async saveSubsInfo(bForced: boolean = false) {
    let user = this.parent.user.user;
    let changed = 0;
    for (let ng of this.newsgroups) {
      let nid = ng.n.id;
      let subsElem = ng.subsInfo.subsElem();
      let jsonStr = JSON.stringify(subsElem);
      let savedStr = this.savedSubsString[nid];
      if (jsonStr != savedStr || bForced) {
        this.savedSubsString[nid] = jsonStr;
        changed++;
        if (user)
          await api_subsInfo_write(user.id, [subsElem])
      }
    }
    if (changed && !user && this.nologin_subsInfo) {
      let h: ISubsHash = {};
      for (let ng of this.newsgroups)
        h[ng.n.id] = ng.subsInfo.subsElem();
      console.log('save:', h);
      localStorage.setItem('nnsbbs_subsInfo', JSON.stringify(h));
    }
  }
  /*
    getSubsInfo(name: string): ISubsInfo | null {
      let ng = this.name2newsgroup(name);
      if (ng)
        return ng.subsInfo;
      else {
        console.log(`newsgroup: ${name} not found`);
        return null;
      }
    }
  */

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
