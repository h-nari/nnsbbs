import { get_json } from "./util";
import { TopBar } from "./topbar";
import { NewsGroupsPane, INewsGroup } from "./newsgroup";
import { TitlesPane } from './titles';
import { ArticlePane } from './article';
import { User } from './user';
import { Btn, BtnDropdown } from "./toolbar";
import { GeometryManager } from "./gemotry_manager";
import { contextMenu, closeContextMenu } from "./context_menu";
import { i18n } from "i18next";
import { UserAdmin } from "./userAdmin";
import { NewsgroupAdmin } from "./newsgroupAdmin";
import { UserInfo } from "./userInfo";
import { api_newsgroup, api_reaction_type, api_reaction_user, api_reaction_write, api_report, api_report_type, IReactionType, IReport } from "./dbif";
import { ReadSet } from "./readSet";
import { Menu } from "./menu";
import { div, label, option, select, span, tag } from "./tag";
import { ReportManaget } from "./reportManager";
import { ReportPage } from "./reportPage";


export default class NnsBbs {
  public topBar = new TopBar(this);
  public user = new User(this);
  public userAdmin = new UserAdmin(this);
  public userInfo = new UserInfo(this);
  public newsgroupAdmin = new NewsgroupAdmin(this);
  public reportManager = new ReportManaget(this);
  public reportPage = new ReportPage(this);
  public gm = new GeometryManager('main');
  public i18next: i18n;
  private ng_pane = new NewsGroupsPane('newsgroup', this);
  private titles_pane = new TitlesPane('titles', this);
  private article_pane = new ArticlePane('article', this);
  private cur_newsgroup: string = '';
  private cur_newsgroup_id: string = '';
  public reaction_type: IReactionType | null = null;

  constructor(i18next: i18n) {
    this.i18next = i18next;
    this.gm.add(this.ng_pane, this.titles_pane, this.article_pane);
    this.ng_pane.expansion_ratio = 1;
    this.titles_pane.expansion_ratio = 2;
    this.article_pane.expansion_ratio = 4;

    // buttons in newsgroup pane
    this.ng_pane.toolbar.add_menu(new Menu({
      icon: 'check-all',
      explain: 'show-all-newsgroups',
      action: () => {
        // $('#newsgroup_lg').removeClass('hide-not-subscribed');
        this.ng_pane.bShowAll = true;
        this.redisplay();
      }
    })).add_menu(new Menu({
      icon: 'check',
      explain: 'only-subscribed-newsgroups',
      action: () => {
        // $('#newsgroup_lg').addClass('hide-not-subscribed');
        this.ng_pane.bShowAll = false;
        this.redisplay();
      }
    }));


    // Buttons in title pane
    this.titles_pane.toolbar.add_menu(new Menu({
      icon: 'x-square',
      explain: 'close-titles-and-article-pane',
      action: () => {
        this.titles_pane.close();
        this.article_pane.close();
        window.history.pushState(null, '', '/bbs');
        document.title = 'nnsbbs';
      }
    })).add_btn(new BtnDropdown({
      icon: 'three-dots',
      explain: 'display-setting',
      dropdown: [
        {
          name: 'thread-display', action: () => {
            this.titles_pane.disp_thread(true);
            this.redisplay();
          }
        },
        {
          name: 'time-order-display', action: () => {
            this.titles_pane.disp_thread(false);
            this.redisplay();
          }
        },
      ]
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
      action: () => {
        let t = this.titles_pane;
        let a = this.article_pane;
        t.scrollToNextUnread() || t.scrollToNextUnread(true);   // search from Top
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
    }));

    this.article_pane.toolbar.add_menu(new Menu({
      icon: 'x-square',
      explain: 'close-article',
      action: () => {
        this.article_pane.close();
        window.history.pushState(null, '', `/bbs/${this.cur_newsgroup}`);
        document.title = `nnsbbs/${this.cur_newsgroup}`;
      }
    }))
    let article_menu = new Menu({
      icon: 'three-dots',
      action: (e, menu) => {
        menu.clear();
        menu.add(new Menu({
          icon: 'card-heading',
          html_i18n: 'toggle-article-header',
          action: () => {
            this.article_pane.toggle_header()
          }
        })).add(new Menu({
          icon: 'reply-fill',
          html_i18n: 'reply-to-article',
          action: () => {
            if (this.titles_pane.newsgroup && this.article_pane.article)
              this.user.post_article_dlg(this.titles_pane.newsgroup, this.article_pane.article);
          }
        })).add(new Menu({
          icon: 'exclamation-diamond',
          html_i18n: 'report', action: () => {
            this.report_dlg();
          }
        }));
        let newsgroup = this.titles_pane.newsgroup;
        let article = this.article_pane.article;
        let user = this.user.user;
        if (newsgroup && article && user && (article.user_id == user.id || user.moderator)) {
          menu.add(new Menu({
            icon: 'pencil-square',
            html_i18n: 'correct-article',
            action: () => {
              if (newsgroup && article)
                this.user.post_article_dlg(newsgroup, article, true);
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
            let a = await api_reaction_user(this.cur_newsgroup_id, article.article_id, article.rev, this.user.user.id);
            if (this.reaction_type) {
              for (let k in this.reaction_type) {
                let ra = this.reaction_type[k];
                reaction_menu.add(new Menu({
                  with_check: true,
                  checked: ra.id == a.type_id,
                  icon: ra.icon,
                  icon_class: 'response',
                  html_i18n: ra.name,
                  action: () => { this.add_reaction(ra.id); }
                }));
              }
              reaction_menu.add(new Menu({
                with_check: true,
                checked: !a.type_id,
                icon: 'x',
                html_i18n: 'no-reaction',
                action: () => { this.add_reaction(-1); }
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

    this.ng_pane.showAllNewsgroupCb = () => {
      this.ng_pane.bShowAll = true;
      this.redisplay();
    };

    this.ng_pane.setClickCb((ng: INewsGroup) => {
      this.select_newsgroup(ng);
    })
    this.titles_pane.setClickCb((newsgroup_id, article_id) => {
      this.select_article(newsgroup_id, article_id);
    });

    this.article_pane.fNext = () => {
      this.next_article();
    };

    // context menu

    $(document).on('contextmenu', '.no-contextmenu', e => {
      closeContextMenu();
      e.preventDefault();
    });

    $(document).on('contextmenu', '.newsgroup-line', e => {
      let newsgroup = e.currentTarget.attributes['newsgroup-name'].value;
      contextMenu(e, {
        title: newsgroup,
        width: 300,
        buttons: {
          btn1: {
            text: 'make-all-read',
            action: ev => {
              this.ng_pane.read_all(newsgroup);
              this.redisplay();
            }
          },
          btn2: {
            text: 'make-all-unread',
            action: ev => {
              this.ng_pane.unread_all(newsgroup);
              this.redisplay();
            }
          },
          btn3: {
            text: 'make-unread-last-50',
            action: ev => {
              this.ng_pane.read_all(newsgroup, 50);
              this.redisplay();
            }
          }
        }
      });
    });

    $(document).on('contextmenu', '.title-contextmenu', e => {
      let article_id = parseInt($(e.currentTarget).attr('article_id') || "0");
      let newsgroup = this.titles_pane.newsgroup;
      if (!newsgroup) return;
      if (!newsgroup.subsInfo)
        newsgroup.subsInfo = { subscribe: false, read: new ReadSet(), update: false };
      let si = newsgroup.subsInfo;
      contextMenu(e, {
        title: this.i18next.t('article') + article_id,
        width: 300,
        buttons: {
          btn1: {
            text: 'mark-article-as-read',
            action: ev => {
              si.read.add_range(article_id);
              this.ng_pane.saveSubsInfo();
              this.redisplay();
            }
          },
          btn2: {
            text: 'mark-article-as-unread',
            action: ev => {
              si.read.sub_range(article_id);
              this.ng_pane.saveSubsInfo();
              this.redisplay();
            }
          }
        }
      });
    });
  }

  // Called from the built-in script of topPage
  // Read and display a list of newsgroups
  async top_page(newsgroup: string = '', article_id: string = '', rev: string = '') {
    this.reaction_type = (await api_reaction_type()).data;
    let data = await api_newsgroup();
    this.ng_pane.setNewsgroups(data);
    await this.ng_pane.loadSubsInfo();
    $('#newsgroup').html(this.ng_pane.inner_html());
    this.ng_pane.bind();

    if (newsgroup == "") {
      this.titles_pane.close();
      this.article_pane.close();
    } else {
      await this.select_newsgroup(newsgroup);
      if (article_id == "") {
        this.article_pane.close();
      } else {
        let r = parseInt(rev);
        this.select_article(this.cur_newsgroup_id, article_id, r);
      }
    }
    this.redisplay();
  }

  // Processing when a newsgroup is selected.
  async select_newsgroup(arg: string | INewsGroup) {
    let newsgroup: INewsGroup | null;

    if (typeof arg == 'string') {
      newsgroup = this.ng_pane.name2newsgroup(arg);
      if (!newsgroup) throw Error(`newsgroup:${arg} not found`);
    } else {
      newsgroup = arg;
    }

    this.ng_pane.select_newsgroup(newsgroup);
    await this.titles_pane.open(newsgroup);

    this.titles_pane.scrollToNextUnread();
    this.titles_pane.show();
    this.article_pane.close();
    this.redisplay();

    let name = newsgroup.n.name;
    window.history.pushState(null, '', `/bbs/${name}`);
    document.title = `nnsbbs/${name}`;
    this.cur_newsgroup = name;
    this.cur_newsgroup_id = newsgroup.n.id;
  }

  async select_article(newsgroup_id: string, article_id: string, rev: number = 0) {
    await this.article_pane.open(newsgroup_id, article_id, rev);
    this.titles_pane.select_article(article_id, rev);
    this.article_pane.show();

    if (this.titles_pane.newsgroup) {
      let subsInfo = this.titles_pane.newsgroup.subsInfo;
      if (!subsInfo)
        subsInfo = this.titles_pane.newsgroup.subsInfo = { subscribe: false, read: new ReadSet(), update: false };
      subsInfo.read.add_range(Number(article_id));                 // make article read
      this.ng_pane.saveSubsInfo();
    }
    this.redisplay();

    window.history.pushState(null, '', `/bbs/${this.cur_newsgroup}/${article_id}`);
    document.title = `nnsbbs/bss/${this.cur_newsgroup}/${article_id}`
  }

  next_article() {
    let t = this.titles_pane;
    if (!t.scrollToNextUnread()) {
      this.ng_pane.scrollToNextSubscribedNewsgroup();
      t.scrollToNextUnread();
    }
    if (t.cur_article_id && t.newsgroup)
      this.select_article(t.newsgroup.n.id, t.cur_article_id);
  }

  redisplay() {
    this.ng_pane.redisplay();
    this.titles_pane.redisplay();
    this.article_pane.redisplay();
    this.set_i18n_text();
    $('.tooltip').remove();
    (<any>$('[title]')).tooltip();
  }

  set_i18n_text() {
    let i18next = this.i18next;
    $('[i18n]').each(function () {
      let key = $(this).attr('i18n') || "no-key";
      let val = i18next.t(key);
      $(this).text(val);
    });
    $('[html-i18n]').each(function () {
      let key = $(this).attr('html-i18n') || "no-key";
      let val = i18next.t(key);
      $(this).text(val);
    });
    $('[title-i18n]').each(function () {
      let key = $(this).attr('title-i18n') || "no-key";
      let val = i18next.t(key);
      $(this).attr('title', val);
    });
  }

  setLanguage(lang: string) {
    this.i18next.changeLanguage(lang, (err, t) => {
      if (err) console.log('changeLanguage failed:', err);
      else {
        this.set_i18n_text();
      }
    });
  }


  async onLogin() {
    if (this.user.user) {
      await this.ng_pane.loadSubsInfo();
      this.topBar.set_login_menu(this.user.user.disp_name);
      this.redisplay();
    } else {
      throw new Error('unexpected situation');
    }
  }

  beforeLogout() {
    this.ng_pane.saveSubsInfo();
  }

  onLogout() {
    this.topBar.set_logout_menu();
    this.ng_pane.clearSubsInfo();
    if (window.location.pathname.startsWith('/admin'))
      window.location.pathname = '/';
    this.redisplay();
  }

  async add_reaction(type_id: number) {
    let article = this.article_pane.article;
    if (article && this.user.user) {
      let n_id = this.cur_newsgroup_id;
      let a_id = article.article_id;
      let rev = article.rev;
      let u_id = this.user.user.id;

      await api_reaction_write(n_id, a_id, rev, u_id, type_id);
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

    let article = this.cur_newsgroup + '/' + a.article_id;
    if (a.rev > 0) article += '#' + a.rev;
    article = '[' + article + '] ' + a.title;

    $.confirm({
      title: this.i18next.t('report-post-to-administrator'),
      type: 'red',
      columnClass: 'large',
      content: div({ class: 'report-dlg' },
        div(label({ i18n: 'article-to-be-reported' }), div({ class: 'article' }, article)),
        div(label({ i18n: 'type-of-violation' }), select({ class: 'type' }, c)),
        div(label({ i18n: 'report-detail' })),
        tag('textarea', { class: 'detail' })),
      onOpen: () => { this.set_i18n_text(); },
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
              newsgroup_id: this.cur_newsgroup_id,
              article_id: a.article_id,
              rev: a.rev,
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
}

