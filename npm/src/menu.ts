import { div, button, icon, span } from './tag';
import { nullstr } from './util';

var sn = 0;

type MenuAction = (e: JQuery.ClickEvent, arg: any) => void;

interface MenuOption {
  icon?: string,
  icon_class?: string,
  name?: string,
  html_i18n?: string,
  right_icon?: string,
  right_icon_class?: string,
  explain?: string,
  action?: MenuAction,
  link?: string,
  arg?: any
  with_check?: true,
  checked?: boolean
};

export class Menu {
  public id: string;
  public opt: MenuOption;
  public subMenu: Menu[] = [];

  constructor(opt: MenuOption) {
    this.id = 'menu-' + sn++;
    this.opt = opt;
  }

  html(): string {
    let opt = this.opt;
    let c = '';

    if (opt.with_check) c += span({ class: 'with-check' }, opt.checked ? icon('check') : '');
    if (opt.icon) c += icon(opt.icon, 'icon ' + nullstr(opt.icon_class));
    if (opt.name) c += opt.name;
    if (opt.html_i18n) c += span({ 'html-i18n': opt.html_i18n }, opt.html_i18n);
    if (opt.right_icon) c += icon(opt.right_icon, 'right-icon ' + nullstr(opt.right_icon_class));

    return button({ class: 'menu btn', id: this.id, 'title-i18n': opt.explain }, c);
  }

  bind() {
    $(`#${this.id}`).on('click', e => {
      $('.menu-back').remove();
      $('.tooltip').remove();
      if (this.opt.link) {
        document.location.href = this.opt.link;
      }
      else if (this.opt.action) {
        this.opt.action(e, this.opt.arg);
      } else if (this.subMenu.length > 0) {
        this.expand(e);
      }
    });
  }

  expand(e: JQuery.ClickEvent) {
    if (this.subMenu.length > 0) {
      let s = this.subMenu.map(m => m.html()).join('');
      let sub_id = this.id + '-sub';
      let offset = $(e.currentTarget).offset();
      let h = $(e.currentTarget).height() || 0;
      let x = offset?.left || 0;
      let y = (offset?.top || 0) + h + 5;
      let style = `top: ${y}px; left: ${x}px;`;
      $('body').prepend(div({ class: 'menu-back', style: 'z-index:10' },
        div({ id: sub_id, style }, s)));
      this.subMenu.forEach(m => { m.bind(); });
      $('.menu-back').on('click', () => {
        $('.menu-back').remove();
      });
      window.nnsbbs.set_i18n_text();
      let w0 = $('.menu-back').width() || 0;
      let w = $('#' + sub_id).width() || 0;
      w0 -= 30;
      if (x + w > w0) {
        $('#' + sub_id).offset({ top: y, left: w0 - w });
      }
    }
    e.preventDefault();
    e.stopPropagation();
  }



  add(m: Menu) {
    this.subMenu.push(m);
    return this;
  }

  clear() {
    this.subMenu = [];
    return this;
  }
}

