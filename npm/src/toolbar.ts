import { Menu } from "./menu";
import { div, span, tag, label, input, button, ul, li, a } from "./tag";

type IToggleCB = (bOpen: boolean) => void;

var sn = 0;
export class ToolBar {
  private id: string;
  private id_chk: string;                    // The id of the open/close switching icon
  public title: string;
  private menus: Menu[] = [];
  private open_icon_name = 'bi-caret-down-fill';
  private close_icon_name = 'bi-caret-right-fill';
  private bOpen: boolean = true;
  private toggle_cb: IToggleCB | null = null;

  constructor(title: string = "") {
    this.id = "toolbar-" + sn++;
    this.id_chk = this.id + "-chk";
    if (title != "")
      this.title = title;
    else
      this.title = this.id;
  }

  innerHtml() {
    let s = tag('i', { id: this.id_chk, class: this.bOpen ? this.open_icon_name : this.close_icon_name })
    s += span({ class: 'toolbar-title' }, this.title);
    for (let btn of this.menus)
      s += btn.html();
    return s;
  }

  html(): string {
    return div({ class: 'toolbar', id: this.id }, this.innerHtml());
  }

  redisplay() {
    $('#' + this.id).html(this.innerHtml());
    this.bind();
  }

  bind() {
    $('#' + this.id_chk).on('click', () => {
      this.setState(!this.bOpen)
    });
    for (let btn of this.menus)
      btn.bind();
  }

  add_menu(menu: Menu) {
    this.menus.unshift(menu);
    return this;
  }

  setState(bOpen: boolean) {
    this.bOpen = bOpen;
    if (bOpen) {
      $('#' + this.id_chk).removeClass(this.close_icon_name);
      $('#' + this.id_chk).addClass(this.open_icon_name);
      $('#' + this.id).removeClass('closed');
    } else {
      $('#' + this.id_chk).addClass(this.close_icon_name);
      $('#' + this.id_chk).removeClass(this.open_icon_name);
      $('#' + this.id).addClass('closed');
    }
    if (this.toggle_cb)
      this.toggle_cb(bOpen);
  }

  setTogleCB(cb: IToggleCB) {
    this.toggle_cb = cb;
  }

  setTitle(title: string) {
    this.title = title;
    $(`#${this.id} .toolbar-title`).html(title);
  }
}
