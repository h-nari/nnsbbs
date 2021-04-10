import { get_json } from "./util";
import { div, button } from "./tag";
import { Btn, ToolBar } from "./toolbar";
import { Pane , ToolbarPane} from './pane';

export interface INewsGroup {
  id: number;
  name: string;
  comment: string;
};

export class NewsGroupsPane extends ToolbarPane {
  private id_lg;      // list-group id
  private data: INewsGroup[] = [];
  private clickCb: ((newsgroup_id: number) => void) | null = null;

  constructor(id: string) {
    super(id);
    this.id_lg = id + "_lg";
    this.toolbar.title = 'NewsGroup';
    this.toolbar.add_btn(new Btn({ icon: 'caret-right' }));
    this.toolbar.add_btn(new Btn({ icon: 'caret-down-fill' }));
    this.toolbar.add_btn(new Btn({ icon: 'gear-fill' }));
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
    return super.html() +
      div({ class: 'newsgroup' },
        div({ id: this.id_lg, class: 'nb-list-group' },
          this.data.map(d => button({ 'newsgroup-id': d.id }, d.name)).join('')
        ));
  }
  bind() {
    super.bind();
    $(`#${this.id_lg} >button`).on('click', ev => {
      let t = ev.currentTarget;
      let ng_id = t.attributes['newsgroup-id'].value;
      if (this.clickCb) this.clickCb(ng_id);
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

}
