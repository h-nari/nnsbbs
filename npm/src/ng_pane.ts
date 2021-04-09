import { get_json } from "./util";
import { div, button } from "./tag";
import { Btn, ToolBar } from "./toolbar";

export interface INewsGroup {
  id: number;
  name: string;
  comment: string;
};

export class NewsGroupsPane {
  private id: string = "newsgroups-pane";
  private data: INewsGroup[] = [];
  private clickCb: ((newsgroup_id: number) => void) | null = null;
  public toolbar = new ToolBar('NewGroup');

  constructor() {
    this.toolbar.add_btn(new Btn({icon:'caret-right'}));
    this.toolbar.add_btn(new Btn({icon:'caret-down-fill'}));
    this.toolbar.add_btn(new Btn({icon:'gear-fill'}));
    this.toolbar.add_btn(new Btn({icon:'x-square'}));
  }

  setData(data: INewsGroup[]) {
    this.data = data;
  }

  setClickCb(cb: (n: number) => void) {
    this.clickCb = cb;
  }

  html(): string {
    return this.toolbar.html() +
      div({ class: 'newsgroup' },
        div({ id: this.id, class: 'nb-list-group' },
          this.data.map(d => button({ 'newsgroup-id': d.id }, d.name)).join('')
        ));
  }
  bind() {
    this.toolbar.bind();
    $(`#${this.id} >button`).on('click', ev => {
      let t = ev.currentTarget;
      let ng_id = t.attributes['newsgroup-id'].value;
      if (this.clickCb) this.clickCb(ng_id);
    });
  }

  select_newsgroup(id: number) {
    $(`#${this.id} >button`).removeClass('active');
    $(`#${this.id} >button[newsgroup-id=${id}]`).addClass('active');
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

}
