import { Menu } from "./menu";
import { div, span, tag, label, input, button, ul, li, a } from "./tag";

type IToggleCB = (bOpen: boolean) => void;

var sn = 0;
export class ToolBar {
  private id: string;
  private id_chk: string;                    // The id of the open/close switching icon
  public title: string;
  private btns: (Btn | Menu)[] = [];
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

  add_btn(btn: Btn): ToolBar {
    this.btns.unshift(btn);        // First add
    return this;
  }

  add_menu(menu: Menu) {
    this.btns.unshift(menu);
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


interface IBtnOption {
  icon: string;
  action?: (e: JQuery.ClickEvent, btn: Btn) => void;
  explain?: string;                                     // title attribute, displayed with mouseover
};

var btn_sn = 0;
export class Btn {
  protected opt: IBtnOption;
  protected id: string;

  constructor(opt: IBtnOption) {
    this.opt = opt;
    this.id = 'toolbar-btn-' + btn_sn++;
  }

  html(): string {
    let opt = { id: this.id };
    if (this.opt.explain)
      opt['title-i18n'] = this.opt.explain;
    return button(opt, tag('i', { class: "bi-" + this.opt.icon }));
  }

  bind() {
    $('#' + this.id).on('click', e => {
      if (this.opt.action)
        this.opt.action(e, this);
    })
  }
}

interface IDropDown {
  name: string;
  explain?: string;
  action?: () => void;
};

interface IBtnDropdownOption extends IBtnOption {
  dropdown: IDropDown[];
}

export class BtnDropdown extends Btn {
  protected opt: IBtnDropdownOption;
  constructor(opt: IBtnDropdownOption) {
    super(opt);
    this.opt = opt;
  }

  html(): string {
    let id_btn = this.id + '-btn';
    let dm = "";
    let cnt = 0;
    for (let dd of this.opt.dropdown) {
      let id_dd = id_btn + '-' + cnt++;
      let attr = {
        class: 'dropdown-item',
        href: '#',
        id: id_dd,
        'html-i18n': dd.name
      };
      if (dd.explain) {
        attr['title-i18n'] = dd.explain;
        attr['data-toggle'] = 'tooltip';
      }
      dm += li(a(attr, dd.name));
    }
    let btn_attr = {
      class: 'dropdown-toggle',
      type: 'button',
      id: id_btn,
      'data-toggle': 'dropdown',
      'aria-haspopup': true,
      'aria-expanded': false
    };
    if (this.opt.explain) {
      btn_attr['title-i18n'] = this.opt.explain;
    }
    return div({ class: 'dropdown' },
      button(btn_attr, tag('i', { class: 'bi-' + this.opt.icon })),
      ul({
        class: 'dropdown-menu',
        'aria-labelledby': id_btn
      }, dm));
  }

  bind() {
    let id_btn = this.id + '-btn';
    let cnt = 0;
    for (let dd of this.opt.dropdown) {
      let id_dd = id_btn + '-' + cnt++;
      if (dd.action) {
        $('#' + id_dd).on('click', e => {
          if (dd.action)
            dd.action();
          e.preventDefault();
        });
      }
    }
  }
}