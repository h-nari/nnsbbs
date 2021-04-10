import { ToolbarPane } from "./pane";

export class GeometryManager {
  private panes: ToolbarPane[] = [];
  private totalSize: number = 800;
  private id: string;

  constructor(id: string) {
    this.id = id;
  }

  add(...panes: ToolbarPane[]) {
    for (let pane of panes) {
      this.panes.push(pane);
      pane.gm = this;
    }
  }

  html(): string {
    let s = "";
    for (let pane of this.panes)
      s += pane.html();
    return s;
  }

  bind() {
    for (let pane of this.panes)
      pane.bind();
  }

  setSize(n: number | undefined = undefined) {
    let size = n;
    if (!size) {
      size = $(window).height() || 800;
      size -= 70;
    }
    this.totalSize = size;
    $('#' + this.id).css('height', size + 'px');
  }

  update() {
    let freePanes: ToolbarPane[] = [];
    let size = this.totalSize;
    let ratio_sum = 0;

    for (let pane of this.panes) {
      pane.update();

      if (pane.bFixSize) {
        let h = pane.getSize();
        size -= h + 20;
      } else if (!pane.bClosed) {
        freePanes.push(pane);
        ratio_sum += pane.expansion_ratio;
      }
    }

    if (freePanes.length > 0) {
      let h = size - 40;
      for (let pane of freePanes) {
        let hh = h * pane.expansion_ratio / ratio_sum;
        pane.setSize(hh);
      }
    }
  }
}