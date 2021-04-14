import { get_json } from "./util";
import { NewsGroupsPane, INewsGroup } from "./newsgroup";
import { TitlesPane } from './titles';
import { ArticlePane } from './article';
import { Btn, BtnDropdown } from "./toolbar";
import { GeometryManager } from "./gemotry_manager";
import { div, button } from "./tag";
import { contextMenu, closeContextMenu } from "./context_menu";
import "./my_jquery";


export default class NssBss {
  private ng_pane = new NewsGroupsPane('newsgroup');
  private titles_pane = new TitlesPane('titles');
  private article_pane = new ArticlePane('article');
  private cur_newsgroup: string = "";
  private cur_newsgroup_id: number = 0;
  public gm = new GeometryManager('main');

  constructor() {
    this.gm.add(this.ng_pane, this.titles_pane, this.article_pane);
    this.ng_pane.expansion_ratio = 1;
    this.titles_pane.expansion_ratio = 2;
    this.article_pane.expansion_ratio = 4;

    // newsgroupペーンのボタン
    this.ng_pane.toolbar.add_btn(new Btn({
      icon: 'check-all',
      explain: '全てのニュースグループを表示',
      action: () => {
        // $('#newsgroup_lg').removeClass('hide-not-subscribed');
        this.ng_pane.bShowAll = true;
        this.ng_pane.redisplay();
      }
    })).add_btn(new Btn({
      icon: 'check',
      explain: '購読中のニュースグループのみ表示',
      action: () => {
        // $('#newsgroup_lg').addClass('hide-not-subscribed');
        this.ng_pane.bShowAll = false;
        this.ng_pane.redisplay();
      }
    }));

    // titleペーンのボタン
    this.titles_pane.toolbar.add_btn(new Btn({
      icon: 'x-square',
      explain: 'タイトル・記事領域を閉じる',
      action: () => {
        this.titles_pane.close();
        this.article_pane.close();
        window.history.pushState(null, '', '/');
        document.title = 'nnsbbs';
      }
    })).add_btn(new BtnDropdown({
      icon: 'three-dots',       // 他の候補: justify, list, menu-down
      explain: '表示設定',
      dropdown: [
        {
          name: 'スレッド表示', action: () => {
            console.log('スレッド表示');
            this.titles_pane.disp_thread(true);
          }
        },
        {
          name: '投稿順表示', action: () => {
            console.log('投稿順表示');
            this.titles_pane.disp_thread(false);
          }
        },
      ]
    })).add_btn(new Btn({
      icon: 'chevron-bar-down',
      explain: '最後に移動',
      action: () => {
        let div1 = $('#' + this.titles_pane.id + ' .titles')[0];
        let h1 = $(div1).height();
        let div2 = $('#titles_lg')[0];
        let h2 = $(div2).height();
        if (h1 && h2)
          div1.scrollTop = h2 - h1 + 10;
      }
    })).add_btn(new Btn({
      icon: 'chevron-bar-up',
      explain: '先頭に移動',
      action: () => {
        let div = $('#' + this.titles_pane.id + ' .titles')[0];
        div.scrollTop = 0;
      }
    }));

    this.article_pane.toolbar.add_btn(new Btn({
      icon: 'x-square',
      explain: '記事領域を閉じる',
      action: () => {
        this.article_pane.close();
        window.history.pushState(null, '', `/${this.cur_newsgroup}`);
        document.title = `nnsbbs/${this.cur_newsgroup}`;
      }
    }))
    this.article_pane.toolbar.add_btn(new Btn({
      icon: 'card-heading',
      explain: '記事のヘッダの表示を切替',
      action: () => {
        this.article_pane.toggle_header()
      }
    }));

    this.ng_pane.loadSubsInfo();
  }

  html(): string {
    return this.gm.html();
  }

  bind() {
    this.gm.bind();

    this.ng_pane.setClickCb((id: number) => {
      this.select_newsgroup(id);
    })
    this.titles_pane.setClickCb((newsgroup_id, article_id) => {
      this.select_article(newsgroup_id, article_id);
    });

    $(document).on('contextmenu', '.no-contextmenu', e => {
      console.log('no-contextmenu');
      closeContextMenu();
      e.preventDefault();
    });

    $(document).on('contextmenu', '.newsgroup-line', e => {
      console.log('context menu:', e);
      let newsgroup = e.target.attributes['newsgroup-name'].value;
      contextMenu(e, {
        title: newsgroup,
        width: 300,
        buttons: {
          btn1: {
            text: '全て既読にする',
            action: ev => { this.ng_pane.read_all(newsgroup); }
          },
          btn2: {
            text: '全て未読にする',
            action: ev => { this.ng_pane.unread_all(newsgroup); }
          },
          btn3: {
            text: '最新50記事だけ未読にする',
            action: ev => { this.ng_pane.read_all(newsgroup, 50); }
          }
        }
      });
    });

    $(document).on('contextmenu', '.article-title', e => {
      console.log('context menu:', e.target);
      $.dialog({
        content: 'Title ContextMenu'
      });
      e.preventDefault();
    });

  }

  async top_page(newsgroup: string, article_id: string) {
    let data = await get_json('/api/newsgroup');
    this.ng_pane.setData(data as INewsGroup[]);
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
  }

  async select_newsgroup(newsgroup: string | number) {
    let id: number | null;
    let name: string | null;
    if (typeof newsgroup == 'number') {
      id = newsgroup;
      name = this.ng_pane.id2name(id);
      if (!name)
        throw Error(`newsgroup_id:${id} not found`);
    } else if (/\d+/.test(newsgroup)) {
      id = parseInt(newsgroup);
      name = this.ng_pane.id2name(id);
      if (!name) throw Error(`newsgroup_id:${id} not found`);
    } else {
      id = this.ng_pane.name2id(newsgroup);
      name = newsgroup;
      if (!id) throw Error(`newsgroup:${newsgroup} not found`);
    }

    this.ng_pane.select_newsgroup(id);
    this.article_pane.clear();
    $('#article').html(this.article_pane.inner_html());
    let si = this.ng_pane.getSubsInfo(name);
    await this.titles_pane.open(id, name, si);

    $('#titles').html(this.titles_pane.inner_html());
    this.titles_pane.bind();
    this.titles_pane.show();
    this.article_pane.close();

    window.history.pushState(null, '', `/${name}`);
    document.title = `nnsbbs/${name}`;
    this.cur_newsgroup = name;
    this.cur_newsgroup_id = id;
  }

  async select_article(newsgroup_id: number, article_id: number) {
    await this.article_pane.open(newsgroup_id, article_id);
    this.titles_pane.select_article(article_id);
    $('#article').html(this.article_pane.inner_html());
    this.article_pane.show();  // no-displayを解除
    this.article_pane.bind();
    let subsInfo = this.ng_pane.getSubsInfo(this.cur_newsgroup);
    subsInfo.read.add_range(article_id);
    this.ng_pane.redisplay();
    this.titles_pane.redisplay();
    window.history.pushState(null, '', `/${this.cur_newsgroup}/${article_id}`);
    document.title = `nnsbbs/${this.cur_newsgroup}/${article_id}`
  }
}
