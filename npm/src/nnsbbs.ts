import { get_json } from "./util";
import { div } from "./tag";
import { NewsGroupsPane, INewsGroup } from "./ng_pane";
import { TitlesPane } from './titles_pane';
import { ArticlePane } from './article_pain';
import { Btn } from "./toolbar";

export default class NssBss {
  private ng_pane = new NewsGroupsPane();
  private titles_pane = new TitlesPane();
  private article_pane = new ArticlePane();
  private cur_newsgroup: string = "";
  private cur_newsgroup_id: number = 0;

  html(): string {
    let s = "";
    s += div({ id: 'newsgroup' }, this.ng_pane.html());
    s += div({ id: 'gutter1', class: 'gutter' });
    s += div({ id: 'titles' }, this.titles_pane.html());
    s += div({ id: 'gutter2', class: 'gutter' });
    s += div({ id: 'article' }, this.article_pane.html());
    return s;
  }

  bind() {
    this.ng_pane.bind();
    this.titles_pane.bind();
    this.article_pane.bind();

    this.ng_pane.setClickCb((id: number) => {
      this.select_newsgroup(id);
    })
    this.titles_pane.setClickCb((newsgroup_id, article_id) => {
      this.select_article(newsgroup_id, article_id);
    });

    this.article_pane.toolbar.add_btn(new Btn({
      icon: 'card-heading',
      explain : '記事のヘッダの表示を切替',
      action: () => {
        this.article_pane.toggle_header()
      }
    }));
  }

  async top_page(newsgroup: string, article_id: string) {
    let data = await get_json('/api/newsgroup');
    this.ng_pane.setData(data as INewsGroup[]);
    $('#newsgroup').html(this.ng_pane.html());
    this.ng_pane.bind();

    if (newsgroup != "") {
      await this.select_newsgroup(newsgroup);
      if (article_id != "") {
        let id = parseInt(article_id);
        this.select_article(this.cur_newsgroup_id, id);
      }
    }
  }

  async select_article(newsgroup_id: number, article_id: number) {
    await this.article_pane.open(newsgroup_id, article_id);
    this.titles_pane.select_article(article_id);
    $('#article').html(this.article_pane.html());
    this.article_pane.bind();
    window.history.pushState(null, '', `/${this.cur_newsgroup}/${article_id}`);
    document.title = `nnsbbs/${this.cur_newsgroup}/${article_id}`
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
    $('#article').html(this.article_pane.html());
    await this.titles_pane.open(id);
    $('#titles').html(this.titles_pane.html());
    this.titles_pane.bind();

    window.history.pushState(null, '', `/${name}`);
    document.title = `nnsbbs/${name}`;
    this.cur_newsgroup = name;
    this.cur_newsgroup_id = id;
  }
}
