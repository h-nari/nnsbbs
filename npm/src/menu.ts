import { div, button } from './tag';

var sn = 0;

export class Menu {
  public id: string;
  public name: string;
  public subMenu: Menu[] = [];
  public link: string = '';
  public action: (() => void) | null = null;

  constructor(name: string, action: string | (() => void) | null = null) {
    this.id = 'menu-' + sn++;
    this.name = name;
    if (typeof (action) == 'string')
      this.link = action;
    else
      this.action = action;
  }

  html(): string {
    return button({ class: 'menu btn', id: this.id }, this.name);
  }

  bind() {
    $(`#${this.id}`).on('click', e => {
      if (this.link != '') {
        document.location.href = this.link;
      }
      else if (this.action)
        this.action();
      else if (this.subMenu.length > 0) {
        let s = this.subMenu.map(m => m.html()).join('');
        let sub_id = this.id + '-sub';
        let offset = $(e.currentTarget).offset();
        let h = $(e.currentTarget).height() || 0;
        let x = offset?.left || 0;
        let y = (offset?.top || 0) + h + 20;
        let style = `top: ${y}px; left: ${x}px;`;
        $('body').prepend(div({ class: 'menu-back', style: 'z-index:10' },
          div({ id: sub_id, style }, s)));
        this.subMenu.forEach(m => { m.bind(); });
        $('.menu-back').on('click', () => {
          $('.menu-back').remove();
        });
        let w0 = $('.menu-back').width() || 0;
        let w = $('#' + sub_id).width() || 0;
        w0 -= 30;
        if (x + w > w0) {
          $('#' + sub_id).offset({ top: y, left: w0 - w });
        }
      }
    })
  }

  add(m: Menu) {
    this.subMenu.push(m);
  }

  clear() {
    this.subMenu = [];
  }
}
