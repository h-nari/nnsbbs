import { set_i18n } from "./util";
import { TopBar } from "./topbar";
import { NewsgroupsPane, INewsGroup } from "./newsgroup";
import { TitlesPane } from './titles';
import { ArticlePane } from './article';
import { User } from './user';
import { GeometryManager } from "./gemotry_manager";
import { contextMenu, closeContextMenu } from "./context_menu";
import { i18n } from "i18next";
import { UserAdmin } from "./userAdmin";
import { NewsgroupAdmin } from "./newsgroupAdmin";
import { UserInfo } from "./userInfo";
import { api_reaction_type, api_reaction_user, api_reaction_write, api_report, api_report_type, IMembership, IReactionType, IReport, IUser } from "./dbif";
import { ReadSet } from "./readSet";
import { Menu } from "./menu";
import { div, label, option, select, span, tag } from "./tag";
import { ReportManaget } from "./reportManager";
import { ReportPage } from "./reportPage";

export interface NnsBbsInitData {
  login: number;
  user: IUser;
  reaction_type: IReactionType;
  membership: IMembership;
};

export default class NnsBbs {
  public topBar = new TopBar(this);
  public user : User;
  public userAdmin = new UserAdmin(this);
  public userInfo = new UserInfo(this);
  public newsgroupAdmin = new NewsgroupAdmin(this);
  public reportManager = new ReportManaget(this);
  public reportPage = new ReportPage(this);
  public gm = new GeometryManager('main');
  public i18next: i18n;
  private ng_pane = new NewsgroupsPane('newsgroup', this);
  private titles_pane = new TitlesPane('titles', this);
  private article_pane = new ArticlePane('article', this);
  public reaction_type: IReactionType;

  constructor(i18next: i18n, init_data: NnsBbsInitData) {
    this.i18next = i18next;
    this.user = new User(this, init_data.membership);
    if (init_data.login)
      this.user.user = init_data.user;
    this.reaction_type = init_data.reaction_type;
    this.gm.add(this.ng_pane, this.titles_pane, this.article_pane);
    this.ng_pane.expansion_ratio = 1;
    this.titles_pane.expansion_ratio = 2;
    this.article_pane.expansion_ratio = 4;

    // buttons in newsgroup pane
    this.ng_pane.toolbar.add_menu(new Menu({
      icon: 'check-all',
      explain: 'show-all-newsgroups',
      action: () => {
        this.ng_pane.bShowAll = true;
        this.redisplay();
      }
    })).add_menu(new Menu({
      icon: 'check',
      explain: 'only-subscribed-newsgroups',
      action: () => {
        this.ng_pane.bShowAll = false;
        this.redisplay();
      }
    })).add_menu(new Menu({
      icon: 'play-fill',
      explain: 'show-next-unread-article',
      action: () => { this.show_next(); }
    }));


    // Buttons in title pane
    this.titles_pane.toolbar.add_menu(new Menu({
      icon: 'x-square',
      explain: 'close-titles-and-article-pane',
      action: () => {
        this.titles_pane.close();
        this.article_pane.close();
        if (this.ng_pane.curNode)
          window.history.pushState(null, '', '/bbs/' + this.ng_pane.curNode.path);
        else
          window.history.pushState(null, '', '/bbs');
        document.title = 'nnsbbs';
      }
    })).add_menu(new Menu({
      icon: 'three-dots',
      explain: 'display-setting',
      action: (e, menu) => {
        menu.clear();
        menu.add(new Menu({
          name: i18next.t('thread-display'),
          with_check: true,
          checked: this.titles_pane.bDispTherad,
          action: (e, m) => { this.titles_pane.disp_thread(true); }
        }));
        menu.add(new Menu({
          name: i18next.t('time-order-display'),
          with_check: true,
          checked: !this.titles_pane.bDispTherad,
          action: (e, m) => { this.titles_pane.disp_thread(false); }
        }));

        let user = this.user.user;
        if (user && user.moderator) {
          menu.addSeparator();
          menu.add(new Menu({
            name: i18next.t('show-deleted-article'),
            with_check: true,
            checked: this.user.setting.d.showDeletedArticle,
            action: (e, m) => {
              this.user.setting.d.showDeletedArticle = !this.user.setting.d.showDeletedArticle;
              this.user.setting.save();
              this.redisplay();
            }
          }));
        }

        menu.expand(e);
      }
    })).add_menu(new Menu({
      icon: 'align-bottom',
      explain: 'goto-end',
      action: () => {
        let div1 = $('#' + this.titles_pane.id + ' .titles')[0];
        let h1 = $(div1).height();
        let div2 = $('#titles_lg')[0];
        let h2 = $(div2).height();
        if (h1 && h2)
          div1.scrollTop = h2 - h1 + 10;
      }
    })).add_menu(new Menu({
      icon: 'align-top',
      explain: 'goto-begin',
      action: () => {
        let div = $('#' + this.titles_pane.id + ' .titles')[0];
        div.scrollTop = 0;
      }
    })).add_menu(new Menu({
      icon: 'chevron-bar-down',
      explain: 'next-unread-article',
      action: async () => {
        let t = this.titles_pane;
        let a = this.article_pane;
        await t.scrollToNextUnread() || await t.scrollToNextUnread(true);   // search from Top
        if (!a.bClosed && t.newsgroup && t.cur_article_id)
          this.select_article(t.newsgroup.n.id, t.cur_article_id);
      }
    })).add_menu(new Menu({
      icon: 'chevron-bar-up',
      explain: 'previous-unread-article',
      action: () => {
        let t = this.titles_pane;
        let a = this.article_pane;
        t.scrollToPrevUnread() || t.scrollToPrevUnread(true);  // search from Botttom
        if (!a.bClosed && t.newsgroup && t.cur_article_id)
          this.select_article(t.newsgroup.n.id, t.cur_article_id);
      }
    })).add_menu(new Menu({
      icon: 'chat-square-text-fill',
      explain: 'post-new-article',
      action: () => {
        if (this.titles_pane.newsgroup)
          this.user.post_article_dlg(this.titles_pane.newsgroup);
      }
    })).add_menu(new Menu({
      icon: 'chevron-bar-contract',
      explain: 'scroll-to-show-the-selected-line',
      action: () => {
        this.titles_pane.scroll_to_show_selected_line(true);
      }
    }));

    this.article_pane.toolbar.add_menu(new Menu({
      icon: 'x-square',
      explain: 'close-article',
      action: () => {
        this.article_pane.close();
        window.history.pushState(null, '', `/bbs/${this.ng_pane.curNode?.path}`);
        document.title = `nnsbbs/${this.ng_pane.curNode?.path}`;
      }
    }))
    let article_menu = new Menu({
      icon: 'three-dots',
      action: (e, menu) => {
        menu.clear();
        menu.add(new Menu({
          icon: 'card-heading',
          name: i18next.t('toggle-article-header'),
          action: () => {
            this.article_pane.toggle_header()
          }
        })).add(new Menu({
          icon: 'reply-fill',
          name: i18next.t('reply-to-article'),
          action: () => {
            if (this.titles_pane.newsgroup && this.article_pane.article)
              this.user.post_article_dlg(this.titles_pane.newsgroup, this.article_pane.article);
          }
        })).add(new Menu({
          icon: 'exclamation-diamond',
          name: i18next.t('report'),
          action: () => {
            this.report_dlg();
          }
        }));
        let newsgroup = this.titles_pane.newsgroup;
        let article = this.article_pane.article;
        let user = this.user.user;
        if (newsgroup && article && user && user.moderator) {
          menu.addSeparator();
          menu.add(new Menu({
            icon: 'x-square-fill',
            name: i18next.t('ban-article'),
            action: () => {
              if (newsgroup && article)
                this.user.ban_article_dlg(newsgroup, article);
            }
          }));
        }
        menu.expand(e);
      }
    });
    this.article_pane.toolbar.add_menu(article_menu);

    var reaction_menu = new Menu({
      icon: 'person-plus',
      explain: 'add-response',
      action: async (e) => {
        if (!this.user.user) {
          $.alert({
            title: this.i18next.t('login-needed'),
            type: 'red',
            content: this.i18next.t('login-needed-to-add-reaction')
          })
        } else {
          reaction_menu.clear();
          let article = this.article_pane.article;
          if (article && this.user.user) {
            let a = await api_reaction_user(article.newsgroup_id, article.article_id, this.user.user.id);
            if (this.reaction_type) {
              for (let k in this.reaction_type) {
                let ra = this.reaction_type[k];
                reaction_menu.add(new Menu({
                  with_check: true,
                  checked: ra.id == a.type_id,
                  icon: ra.icon,
                  icon_class: 'response',
                  html_i18n: ra.name,
                  action: () => { this.add_reaction(ra.id, a.type_id); }
                }));
              }
              reaction_menu.add(new Menu({
                with_check: true,
                checked: !a.type_id,
                icon: 'x',
                html_i18n: 'no-reaction',
                action: () => { this.add_reaction(null, a.type_id); }
              }));
            }
            reaction_menu.expand(e);
          }
        }
      }
    });
    this.article_pane.toolbar.add_menu(reaction_menu);
  }

  html(): string {
    return this.gm.html();
  }

  bind() {
    this.gm.bind();
    this.gm.updateCB = () => {
      this.titles_pane.scroll_to_show_selected_line(true);
    };
    this.ng_pane.showAllNewsgroupCb = () => {
      this.ng_pane.bShowAll = true;
      this.redisplay();
    };
    this.ng_pane.clickCb = path => {
      this.select_newsgroup(path);
    };
    this.titles_pane.clickCb = (newsgroup_id, article_id) => {
      this.select_article(newsgroup_id, article_id);
    };
    this.article_pane.fNext = () => {
      this.next_article();
    };
  }

  // Called from the built-in script of topPage
  // Read and display a list of newsgroups
  async top_page(newsgroup: string = '', article_id: string = '') {
    await this.ng_pane.redisplay(true);
    if (newsgroup == "") {
      this.titles_pane.close();
      this.article_pane.close();
    } else {
      await this.select_newsgroup(newsgroup);
      if (article_id == "") {
        this.article_pane.close();
      } else if (this.ng_pane.curNode?.ng?.n) {
        await this.select_article(this.ng_pane.curNode.ng.n.id, article_id);
      }
    }
    set_i18n();
  }

  // Processing when a newsgroup is selected.
  async select_newsgroup(path: string) {
    let newsgroup: INewsGroup | undefined;
    let curNode = this.ng_pane.curNode;
    if (!curNode || curNode.path != path)
      curNode = await this.ng_pane.select_newsgroup(path);
    if (!curNode)
      throw new Error(`newsgroup ${path} not found`);

    if (curNode.noChild() && curNode.ng) {
      await this.titles_pane.open(curNode.ng);
      await this.titles_pane.scrollToNextUnread();
      this.titles_pane.show();
      this.article_pane.close();
      this.redisplay();

    } else {
      this.titles_pane.close();
      this.article_pane.close();
    }
    window.history.pushState(null, '', `/bbs/${path}`);
    document.title = `nnsbbs/${path}`;
  }

  async select_article(newsgroup_id: string, article_id: string) {
    let cur_title = this.titles_pane.cur_title();
    if (cur_title && cur_title.bDeleted && !this.user.setting.d.showDeletedArticle) {
      this.article_pane.close();
      return;
    }
    await this.article_pane.open(newsgroup_id, article_id);
    this.article_pane.redisplay();
    await this.titles_pane.select_article(article_id);
    this.titles_pane.scroll_to_show_selected_line(true);
    this.article_pane.show();

    if (this.titles_pane.newsgroup) {
      let subsInfo = this.titles_pane.newsgroup.subsInfo;
      subsInfo.read(article_id);                               // make article read
      this.titles_pane.update_subsInfo(article_id);
      this.ng_pane.update_subsInfo(this.titles_pane.newsgroup.n.name);
      this.ng_pane.saveSubsInfo();
      this.redisplay();
    }

    let curNode = this.ng_pane.curNode;
    if (curNode) {
      window.history.pushState(null, '', `/bbs/${curNode.path}/${article_id}`);
      document.title = `nnsbbs/bss/${curNode.path}/${article_id}`
    }
  }

  async next_article() {
    let t = this.titles_pane;
    if (! await t.scrollToNextUnread()) {
      this.ng_pane.scrollToNextSubscribedNewsgroup();
      if (this.ng_pane.curNode)
        await this.select_newsgroup(this.ng_pane.curNode.path);
    }
    if (!t.bClosed && t.cur_article_id && t.newsgroup)
      await this.select_article(t.newsgroup.n.id, t.cur_article_id);
  }

  redisplay() {
    this.ng_pane.redisplay();
    this.titles_pane.redisplay();
    this.article_pane.redisplay();
    set_i18n();
  }

  setLanguage(lang: string) {
    this.i18next.changeLanguage(lang, (err, t) => {
      if (err) console.log('changeLanguage failed:', err);
      else {
        set_i18n();
      }
    });
  }

  async onLogin() {
    if (this.user.user) {
      this.user.setting.load(this.user.user.setting);
      this.topBar.set_login_menu(this.user.user.disp_name);
      await this.top_page();
      this.redisplay();
    } else {
      throw new Error('unexpected situation');
    }
  }

  async beforeLogout() {
    await this.ng_pane.saveSubsInfo();
  }

  async onLogout() {
    this.user.user = undefined;
    this.topBar.set_logout_menu();
    this.ng_pane.clearSubsInfo();
    await this.top_page();
    this.redisplay();
  }

  async add_reaction(type_id: number | null, old_type_id: number | null) {
    let article = this.article_pane.article;
    if (article && this.user.user && type_id != old_type_id) {
      let n_id = article.newsgroup_id;
      let a_id = article.article_id;
      let u_id = this.user.user.id;

      await api_reaction_write(n_id, a_id, u_id, type_id || -1);
      this.titles_pane.add_reaction(a_id, type_id, 1);
      this.titles_pane.add_reaction(a_id, old_type_id, -1);
      this.redisplay();
    }
  }

  async report_dlg() {
    let c = '';
    let r = await api_report_type();
    for (let v of Object.values(r).reverse())
      c += option({ value: v.id, i18n: v.name }, v.name);

    let a = this.article_pane.article;
    if (!a) return;

    let article = '[' + a.newsgroup + '/' + a.article_id + ']' + a.title;

    $.confirm({
      title: this.i18next.t('report-post-to-administrator'),
      type: 'red',
      columnClass: 'large',
      content: div({ class: 'report-dlg' },
        div(label({ i18n: 'article-to-be-reported' }), div({ class: 'article' }, article)),
        div(label({ i18n: 'type-of-violation' }), select({ class: 'type' }, c)),
        div(label({ i18n: 'report-detail' })),
        tag('textarea', { class: 'detail' })),
      onOpen: () => { set_i18n('.report-dlg'); },
      buttons: {
        post: {
          text: this.i18next.t('report'),
          action: () => {
            let detail = $('.report-dlg .detail').val() as string;
            if (detail == '') {
              $.alert({
                title: this.i18next.t('error'),
                content: this.i18next.t('report-detail-is-blank')
              });
              return false;
            }
            if (!a) return;
            let report: IReport = {
              type_id: $('.report-dlg .type').val() as number,
              newsgroup_id: a.newsgroup_id,
              article_id: a.article_id,
              notifier: this.user.user ? this.user.user.id : undefined,
              detail
            };
            api_report(report).then(() => {
              $.alert(this.i18next.t('i-have-reported-the-post-to-the-administrator'));
            });
          }
        },
        cancel: {
          text: this.i18next.t('cancel'),
          action: () => { }
        }
      }
    });
  }

  // show next unread article
  // return false if no unread article
  async show_next(): Promise<boolean> {
    console.log('**show_next');

    if (this.titles_pane.bClosed) {        // title_pane  closed
      if (!this.ng_pane.scrollToNextSubscribedNewsgroup())
        return await this.no_more_article_dlg();
      if (this.ng_pane.curNode)
        await this.select_newsgroup(this.ng_pane.curNode.path);
      if (this.titles_pane.bClosed)
        return await this.no_more_article_dlg();
    }

    if (this.article_pane.bClosed) {  // title_pane open, artcle_pane closed
      let nid = this.titles_pane.newsgroup?.n.id;
      let article_id = this.titles_pane.cur_article_id;
      if (nid && article_id)
        await this.select_article(nid, article_id);
      else {
        while (true) {
          if (!this.ng_pane.scrollToNextSubscribedNewsgroup()) {
            this.titles_pane.close();
            this.article_pane.close();
            return await this.no_more_article_dlg();
          }
          if (this.ng_pane.curNode) {
            await this.select_newsgroup(this.ng_pane.curNode.path);
            return true;
          }
        }
      }
    } else {                               // article_pane  open
      if (this.article_pane.scrolled_to_end()) {
        await this.next_article();
      } else {
        this.article_pane.scroll();
      }
    }
    return true;
  }

  no_more_article_dlg(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      $.alert({
        title: '',
        content: this.i18next.t('no-unread-article'),
        buttons: { ok: () => { resolve(false) } }
      });
    });
  }
}

