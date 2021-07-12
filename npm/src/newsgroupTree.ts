import { StringMap, TOptions } from 'i18next';
import { Menu } from './menu';
import { INewsGroup, NewsgroupsPane } from './newsgroup';
import { div, input, selected, span } from './tag';
import { splitPath } from './util';

export class NewsgroupTree {
  public ng_pane: NewsgroupsPane;
  public name: string;
  public path: string;
  public fold: boolean = true;
  public depth = 0;
  // public cDecendants: number = 0;
  public parent: NewsgroupTree | undefined;
  public children: NewsgroupTree[] = [];
  public next: NewsgroupTree | undefined;
  public menu: Menu;
  public ng: INewsGroup | undefined;
  public ng_num = 0;
  public subscribed_ng_num = 0;
  public article_num = 0;
  public unread_article_num = 0;
  public posted_at = '';

  constructor(ng_pane: NewsgroupsPane, name: string, path: string) {
    this.ng_pane = ng_pane;
    this.name = name;
    this.path = path;
    this.menu = new Menu({
      icon: 'three-dots',
      action: (e, m) => {
        let i18next = this.ng_pane.parent.i18next;
        m.clear();
        m.add(new Menu({
          name: i18next.t('about-newsgroup'),
          action: (e, m) => { this.about_newsgroup_dlg(); }
        }));
        if (this.depth > 0)
          m.add(new Menu({
            name: i18next.t('fold-all'),
            action: (e, m) => {
              this.forEach(n => { n.fold = true; });
              this.ng_pane.redisplay();
            }
          })).add(new Menu({
            name: i18next.t('unfold-all'),
            action: (e, m) => {
              this.forEach(n => { n.fold = false; });
              this.ng_pane.redisplay();
            }
          }));
        if (this.depth > 1) m.add(new Menu({
          name: i18next.t('unfold-to-one-layer-down'),
          action: (e, m) => {
            this.fold = false;
            this.children.forEach(n => { n.fold = true; });
            this.ng_pane.redisplay();
          }
        }));

        if (this.ng_pane.parent.user.user) {
          m.addSeparator();
          if (this.noChild()) {
            m.add(new Menu({
              name: i18next.t('subscribe'),
              with_check: true,
              checked: this.ng?.subsInfo?.subscribe,
              action: (e, m) => {
                if (this.ng?.subsInfo) {
                  this.ng.subsInfo.subscribe = !this.ng.subsInfo.subscribe;
                  this.toRoot(n => n.calc());
                  this.ng_pane.redisplay();
                }
              }
            }));
          } else {
            m.add(new Menu({
              name: i18next.t('subscribe-all'),
              action: async (e, m) => { this.set_tree_subscribe(true); }
            })).add(new Menu({
              name: i18next.t('unsubscribe-all'),
              action: async (e, m) => { this.set_tree_subscribe(false); }
            }));
          }

          m.addSeparator();
          m.add(new Menu({
            name: i18next.t('read-info-management'),
            action: (e, m) => { this.read_info_dlg() }
          }));
        }
        m.expand(e);
      }
    });
  }

  forEach(func: (n: NewsgroupTree) => void) {
    func(this);
    for (let c of this.children)
      c.forEach(func);
  }

  sumUp(func: (n: NewsgroupTree) => void) {
    for (let c of this.children)
      c.sumUp(func);
    func(this);
  }

  toRoot(func: (n: NewsgroupTree) => void) {
    for (let c: NewsgroupTree | undefined = this; c; c = c.parent)
      func(c);
  }

  findNewsgroup(path: string): NewsgroupTree | undefined {
    let s = splitPath(path);
    if (s.parent) {
      let child = this.findNewsgroup(s.parent);
      if (child)
        return child.findNewsgroup(s.base);
    } else {
      for (let c of this.children)
        if (c.name == s.base)
          return c;
    }
    return undefined;
  }

  allocNewsgroup(path: string, ng: INewsGroup | undefined): NewsgroupTree {
    let s = splitPath(path);
    if (s.parent) {
      let child = this.allocChild(s.parent);
      return child.allocNewsgroup(s.base, ng);
    } else {
      let child = this.allocChild(path);
      child.ng = ng;
      return child;
    }
  }

  allocChild(name: string): NewsgroupTree {
    for (let c of this.children) {
      if (c.name == name)
        return c;
    }
    let path = this.path == '' ? name : this.path + '.' + name;
    let c = new NewsgroupTree(this.ng_pane, name, path);
    c.parent = this;
    this.children.push(c);
    return c;
  }

  sub_html(): string {
    let s = '';
    for (let c of this.children) {
      if (c.subscribed_ng_num > 0 || this.ng_pane.bShowAll)
        s += c.html();
    }
    return s;
  }

  innerHtml(): string {
    let i18next = this.ng_pane.parent.i18next;
    let subscribe_icon = '';
    let fold_icon = '';
    let ng_num = '';
    let article_num = '';
    let user = this.ng_pane.parent.user.user;


    if (this.noChild()) {
      fold_icon = span({ class: 'fold-icon bi-newspaper' });
      if (user) {
        if (this.ng && this.ng.subsInfo?.subscribe)
          subscribe_icon = span({ class: 'subscribe-icon bi-check-circle', 'title-i18n': 'subscribed' });
        else
          subscribe_icon = span({ class: 'subscribe-icon bi-dash-circle-dotted', 'title-i18n': 'unsubscribed' });
      }
    } else {
      fold_icon = span({ class: 'fold-icon btn-fold ' + (this.fold ? 'bi-chevron-right' : 'bi-chevron-down') });
      if (this.fold) {
        if (user) {
          ng_num = span({ class: 'title' }, this.t('num-subscribed'));
          ng_num += span({ class: 'subscribe', 'title-i18n': 'no-of-subscribed-newsgroups' }, this.subscribed_ng_num);
          ng_num += '/';
        } else {
          ng_num = span({ class: 'title' }, this.t('num-newsgroups'));
        }
        ng_num += span({ 'title-i18n': 'no-of-newsgroups' }, this.ng_num);
        ng_num = span({ class: 'ng-num' }, ng_num);
      }
    }
    if (this.article_num > 0) {
      article_num = span({ class: 'article-num' },
        i18next.t('no-of-articles'),
        user ? span({ class: 'unread' }, this.unread_article_num) + '/' : '',
        this.article_num);
    }

    return div({ path: this.path, class: 'ng-node d-flex' + (this == this.ng_pane.curNode ? ' selected' : '') },
      fold_icon,
      span({ class: 'name' }, this.name),
      subscribe_icon,
      ng_num,
      span({ style: 'flex-grow:1' }),
      article_num,
      this.fold && this.article_num > 0 ? span({ class: 'posted-at' }, i18next.t('posted-at'), this.posted_at) : '',
      this.menu.html());
  }

  html(): string {
    return div({ class: 'sub-tree', path: this.path, fold: selected(this.fold) },
      this.innerHtml(),
      (this.fold ? '' : div(this.sub_html())));
  }

  bind() {
    this.menu.bind();
    $(`.ng-tree .ng-node[path="${this.path}"]`).on('click', e => {
      if (this.ng_pane.curNode == this) {
        if (this.hasChild())
          this.fold = !this.fold;
        else if (this.ng_pane.clickCb)
          this.ng_pane.clickCb(this.path);
      } else {
        this.ng_pane.curNode = this;
        if (this.ng_pane.clickCb)
          this.ng_pane.clickCb(this.path);
      }
      this.ng_pane.redisplay();
    });



    $(`.ng-tree .ng-node[path="${this.path}"]  .btn-fold`).on('click', e => {
      if (!this.noChild())
        this.fold = !this.fold;
      this.ng_pane.redisplay();
      e.stopPropagation();
    });

    $(`.ng-tree .ng-node[path="${this.path}"] .subscribe-icon`).on('click', e => {
      let target = e.currentTarget.parentElement;
      if (!target) return;
      let path = target.attributes['path'].value;
      let node = this.ng_pane.root.findNewsgroup(path);
      if (!node || !node.ng) return;
      node.ng.subsInfo.subscribe = !node.ng.subsInfo.subscribe;
      node.ng_pane.saveSubsInfo();
      for (let n: NewsgroupTree | undefined = node; n; n = n.parent)
        node.toRoot(n => n.calc());
      node.ng_pane.redisplay();
    });

    $(`.ng-tree .ng-node[path="${this.path}"] .name`).on('click', e => {
      this.about_newsgroup_dlg();
    });

    for (let c of this.children)
      c.bind();
  }

  calc() {
    this.ng_num = this.subscribed_ng_num = 0;
    this.article_num = this.unread_article_num = 0;
    this.subscribed_ng_num = 0;
    this.posted_at = '';


    if (this.ng) {
      if (this.noChild()) {
        this.article_num = this.ng.subsInfo.article_count();
        this.unread_article_num = this.ng.subsInfo.unread_article_count();
        if (this.ng.subsInfo.subscribe)
          this.subscribed_ng_num = 1;
      }
    }
    if (this.noChild()) {
      this.ng_num = 1;
      if (this.ng)
        this.posted_at = this.ng.n.posted_at;
      this.depth = 0;
    } else for (let c of this.children) {
      this.ng_num += c.ng_num;
      this.subscribed_ng_num += c.subscribed_ng_num;
      this.article_num += c.article_num;
      this.unread_article_num += c.unread_article_num;
      if (c.posted_at > this.posted_at) this.posted_at = c.posted_at;
      this.depth = Math.max(this.depth, c.depth + 1);
    }
  }

  about_newsgroup_dlg() {
    let i18next = this.ng_pane.parent.i18next;
    var c = '';
    this.toRoot(n => {
      c = div({ class: 'sub-newsgroup' },
        div({ class: 'name' }, n.path),
        div({ class: 'explain' }, n.ng ? n.ng.n.comment : ''), c);
    });
    $.alert({
      title: i18next.t('about-newsgroup'),
      type: 'green',
      columnClass: 'medium',
      content: div({ class: 'about-newsgroup-dlg' }, c)
    });
  }

  calcAll() {
    this.sumUp(n => n.calc());
    this.toRoot(n => n.calc());
    this.ng_pane.redisplay();
    this.ng_pane.saveSubsInfo();
  }

  set_tree_subscribe(subscribe: boolean) {
    this.forEach(n => {
      if (n.ng && n.ng.subsInfo)
        n.ng.subsInfo.subscribe = subscribe;
    });
    this.calcAll();
  }

  noChild(): boolean {
    return this.children.length == 0;
  }

  hasChild(): boolean {
    return this.children.length > 0;
  }

  read_all(last: number = 0) {
    if (this.noChild()) {
      if (this.ng)
        this.ng.subsInfo.read_all(last);
    } else for (let c of this.children)
      c.read_all(last);
  }

  unread_all() {
    if (this.noChild()) {
      if (this.ng)
        this.ng.subsInfo.unread_all();
    } else for (let c of this.children)
      c.unread_all();
  }

  t(msg: string, opt: (TOptions<StringMap> | undefined) = undefined) {
    let i18next = this.ng_pane.parent.i18next;
    return i18next.t(msg, opt);
  }

  read_info_dlg() {
    let c = '';
    let setting = this.ng_pane.parent.user.setting;
    if (this.noChild()) {
      c = span(this.t('board-f-articles', { f: this.path }));
    } else {
      c = span(this.t('articles-under-f', { f: this.path }));
    }
    c = div({ class: 'd-flex' }, c,
      span({ style: 'flex-grow: 10;' }),
      span({ class: 'label' }, this.t('specified-number')),
      input({ class: 'specified-number', type: 'number', min: 1, value: setting.d.articleUnread, width: 3 })
    )

    $.confirm({
      title: this.t('read-info-management'),
      type: 'green',
      columnClass: 'large',
      content: div({ class: 'read-info-dlg' }, c),
      buttons: {
        read_all: {
          text: this.t('make-all-read'),
          action: () => {
            this.read_all();
            this.calcAll();
            this.ng_pane.saveSubsInfo();
            this.ng_pane.parent.redisplay();
          }
        },
        unread_all: {
          text: this.t('make-all-unread'),
          action: () => {
            this.unread_all();
            this.calcAll();
            this.ng_pane.saveSubsInfo();
            this.ng_pane.parent.redisplay();
          }
        },
        unread_last_50: {
          text: this.t('make-unread-last-n'),
          action: () => {
            let n = $('.read-info-dlg .specified-number').val() as number;
            console.log('n:', n);
            this.read_all(n);
            this.calcAll();
            if (n != setting.d.articleUnread) {
              setting.d.articleUnread = n;
              setting.save();
            }
            console.log('saveSubsInfo');
            this.ng_pane.saveSubsInfo();
            this.ng_pane.parent.redisplay();
          }
        },
        cancel: {
          text: this.t('cancel')
        }
      }
    });
  }

  hasArticles(): boolean {
    if (!this.noChild() || !this.ng) return false;
    return this.ng.subsInfo.unread_article_count() > 0;
  }
}

