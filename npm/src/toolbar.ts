import { div, span, tag, label, input } from "./tag";

var sn = 0;

export class ToolBar {
  private id: string;
  private id_chk: string;                    // open/close切替のアイコンのid
  public title: string;
  private btns: Btn[] = [];
  private open_icon_name = 'bi-caret-down-fill';
  private close_icon_name = 'bi-caret-right-fill';
  private bOpen: boolean = true;

  constructor(title: string = "") {
    this.id = "toolbar-" + sn++;
    this.id_chk = this.id + "-chk";
    if (title != "")
      this.title = title;
    else
      this.title = this.id;
  }

  html(): string {
    let s = tag('i', { id: this.id_chk, class: this.bOpen ? this.open_icon_name : this.close_icon_name })
    s += span({ class: 'toolbar-title' }, this.title);
    for (let btn of this.btns)
      s += btn.html();
    return div({ class: 'toolbar', id: this.id }, s);
  }

  bind() {
    $('#' + this.id_chk).on('click', () => {
      this.setState(!this.bOpen)
    });
    for (let btn of this.btns)
      btn.bind();
  }

  add_btn(btn: Btn) {
    this.btns.push(btn);
  }

  setState(bOpen: boolean) {
    console.log('setState:', bOpen);
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
  }
}


interface IBtnOption {
  icon: string;
  action?: (e: JQuery.ClickEvent, btn: Btn) => void;
  explain?: string;                                     // title属性、mouseoverで表示される
};

var btn_sn = 0;
export class Btn {
  private opt: IBtnOption;
  private id: string;

  constructor(opt: IBtnOption) {
    this.opt = opt;
    this.id = 'toolbar-btn-' + btn_sn++;
  }

  html(): string {
    let opt = { id: this.id, class: "bi-" + this.opt.icon };
    if (this.opt.explain)
      opt['title'] = this.opt.explain;
    return tag('i', opt);
  }

  bind() {
    $('#' + this.id).on('click', e => {
      if (this.opt.action)
        this.opt.action(e, this);
    })
  }
}