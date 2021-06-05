import { GeometryManager } from "./gemotry_manager";
import NnsBbs from "./nnsbbs";
import { ToolBar } from "./toolbar";

var pane_sn = 0;

export class Pane {
  public id: string;
  public bFixSize: boolean = false;
  public bClosed: boolean = false;
  public natural_size: number = 200;
  public min_size: number = 10;
  public gm: GeometryManager | null = null;
  public expansion_ratio: number = 1;          // Weighting when expanding and dividing the area

  constructor(id: string | null = null) {
    if (id)
      this.id = id;
    else
      this.id = "pane-" + pane_sn++;
  }

  html(): string {
    return "";
  }

  bind() { }

  setSize(size) {
    $('#' + this.id).css('height', size + "px");
  }

  getSize(): number {
    return $('#' + this.id).height() || 100;
  }

  close() {
    this.bClosed = true;
    $('#' + this.id).addClass("no-display");
    this.gm?.update()
  }

  show() {
    this.bClosed = false;
    $('#' + this.id).removeClass("no-display");
    this.gm?.update()
  }
}

export class ToolbarPane extends Pane {
  public toolbar: ToolBar;
  public parent: NnsBbs;

  constructor(id: string | null, parent: NnsBbs) {
    super(id);
    this.parent = parent;
    this.toolbar = new ToolBar(id ? id : '%no-title%');
  }

  html() {
    return this.toolbar.html();
  }

  bind() {
    this.toolbar.bind();
    this.toolbar.setTogleCB(bOpen => {
      this.bFixSize = !bOpen;
      this.gm?.update();
    });
  }

  show() {
    super.show();
    this.toolbar.setState(true);
  }

  update() {
    if (this.bFixSize) {
      let h0 = $('#' + this.id).height();
      if (h0) this.natural_size = h0;
      let h = $('#' + this.id + " .toolbar").height();
      if (h)
        this.setSize(h + 10);
    } else {
      this.setSize(this.natural_size);
    }
  }

  t(id: string): string {
    return this.parent.i18next.t(id);
  }
}