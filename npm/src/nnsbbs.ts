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
import { api_newsgroup } from "./dbif";
import { ReadSet } from "./readSet";

export default class NnsBbs {
  public topBar = new TopBar(this);
  public user = new User(this);
  public userAdmin = new UserAdmin(this);
  public userInfo = new UserInfo(this);
  public newsgroupAdmin = new NewsgroupAdmin(this);
  public gm = new GeometryManager('main');
  public i18next: i18n;
  private ng_pane = new NewsGroupsPane('newsgroup', this);
  private titles_pane = new TitlesPane('titles', this);
  private article_pane = new ArticlePane('article', this);
  private cur_newsgroup: string = "";
  private cur_newsgroup_id: number = 0;

  constructor(i18next: i18n) {
    this.i18next = i18next;
    this.gm.add(this.ng_pane, this.titles_pane, this.article_pane);
    this.ng_pane.expansion_ratio = 1;
    this.titles_pane.expansion_ratio = 2;
    this.article_pane.expansion_ratio = 4;

    // buttons in newsgroup pane
    this.ng_pane.toolbar.add_btn(new Btn({
      icon: 'check-all',
      explain: 'show-all-newsgroups',
      action: () => {
        // $('#newsgroup_lg').removeClass('hide-not-subscribed');
        this.ng_pane.bShowAll = true;
        this.redisplay();
      }
    })).add_btn(new Btn({
      icon: 'check',
      explain: 'only-subscribed-newsgroups',
      action: () => {
        // $('#newsgroup_lg').addClass('hide-not-subscribed');
        this.ng_pane.bShowAll = false;
        this.redisplay();
      }
    }));


    // Buttons in title pane
    this.titles_pane.toolbar.add_btn(new Btn({
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
    })).add_btn(new Btn({
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
    })).add_btn(new Btn({
      icon: 'align-top',
      explain: 'goto-begin',
      action: () => {
        let div = $('#' + this.titles_pane.id + ' .titles')[0];
        div.scrollTop = 0;
      }
    })).add_btn(new Btn({
      icon: 'chevron-bar-down',
      explain: 'next-unread-article',
      action: () => {
        let t = this.titles_pane;
        let a = this.article_pane;
        t.scrollToNextUnread() || t.scrollToNextUnread(true);   // search from Top
        if (!a.bClosed && t.newsgroup && t.cur_article_id)
          this.select_article(t.newsgroup.n.id, t.cur_article_id);
      }
    })).add_btn(new Btn({
      icon: 'chevron-bar-up',
      explain: 'previous-unread-article',
      action: () => {
        let t = this.titles_pane;
        let a = this.article_pane;
        t.scrollToPrevUnread() || t.scrollToPrevUnread(true);  // search from Botttom
        if (!a.bClosed && t.newsgroup && t.cur_article_id)
          this.select_article(t.newsgroup.n.id, t.cur_article_id);
      }
    })).add_btn(new Btn({
      icon: 'chat-square-text-fill',
      explain: 'post-new-article',
      action: () => {
        if (this.titles_pane.newsgroup)
          this.user.post_article_dlg(this.titles_pane.newsgroup);
      }
    }));

    this.article_pane.toolbar.add_btn(new Btn({
      icon: 'x-square',
      explain: 'close-article',
      action: () => {
        this.article_pane.close();
        window.history.pushState(null, '', `/bbs/${this.cur_newsgroup}`);
        document.title = `nnsbbs/${this.cur_newsgroup}`;
      }
    }))
    this.article_pane.toolbar.add_btn(new Btn({
      icon: 'card-heading',
      explain: 'toggle-article-header',
      action: () => {
        this.article_pane.toggle_header()
      }
    })).add_btn(new Btn({
      icon: 'reply-fill',
      explain: 'reply-to-article',
      action: () => {
        if (this.titles_pane.newsgroup && this.article_pane.article)
          this.user.post_article_dlg(this.titles_pane.newsgroup, this.article_pane.article);
      }
    }));

    // this.ng_pane.loadSubsInfo();
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
  async top_page(newsgroup: string = '', article_id: string = '') {
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
        let id = parseInt(article_id);
        this.select_article(this.cur_newsgroup_id, id);
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

  async select_article(newsgroup_id: number, article_id: number) {
    await this.article_pane.open(newsgroup_id, article_id);
    this.titles_pane.select_article(article_id);
    this.article_pane.show();                            // Remove no-display
    // let subsInfo = this.ng_pane.getSubsInfo(this.cur_newsgroup);
    if (this.titles_pane.newsgroup) {
      let subsInfo = this.titles_pane.newsgroup.subsInfo;
      if (!subsInfo)
        subsInfo = this.titles_pane.newsgroup.subsInfo = { subscribe: false, read: new ReadSet(), update: false };
      subsInfo.read.add_range(article_id);                 // make article read
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
    this.redisplay();
  }
}

