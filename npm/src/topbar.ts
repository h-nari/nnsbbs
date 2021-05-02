import { a, div, tag, icon, label, select, option, selected } from './tag';
import { Menu } from './menu';
import { escape_html, get_json } from './util';

export class TopBar {
  private id = "TopBar";
  public menu_login = new Menu('Login' + icon('caret-down-fill', 'right-icon'));
  public menu_setting = new Menu(icon('three-dots'));

  constructor() {

    this.menu_setting.add(new Menu(icon('gear-fill') + ' Setting', () => {
      let lang = window.nnsbbs.i18next.language;
      $.alert({
        title: 'Setting',
        content: div({ class: 'setting-dlg' },
          label({ for: 'language' }, 'Language:'),
          select({ id: 'language' },
            option({ value: 'jp', selected: selected(lang == 'jp') }, 'japanese'),
            option({ value: 'en', selected: selected(lang == 'en') }, 'English'))),
        onOpen: () => {
          $('#language').on('change', e => {
            window.nnsbbs.setLanguage($('#language').val() as string);
            window.nnsbbs.redisplay();
          });
        }
      });
    }));
  }

  html(): string {
    return tag('nav', { id: this.id, class: 'topbar' },
      a({ href: window.nnsbbs_baseURL }, 'NNSBBS'),
      this.menu_login.html(),
      this.menu_setting.html());
  }

  bind() {
    this.menu_login.bind();
    this.menu_setting.bind();
    this.check_login_status();
  }

  check_login_status() {
    return new Promise((resolve, reject) => {
      get_json('/api/session').then((d: any) => {
        if (d.login) {
          this.set_login_menu(d.name);
          window.nnsbbs.user.user = { id: d.user_id as string, name: d.name as string };
          resolve(true);
        }
        else {
          this.set_logout_menu();
          window.nnsbbs.user.user = null;
          resolve(false);
        }
      });
    });
  }

  set_login_menu(username: string) {
    let m = this.menu_login;
    m.name = escape_html(username) + icon('caret-down-fill', 'right-icon')
    $('#' + m.id).html(m.name);
    m.clear();
    m.add(new Menu('Logout', () => {
      window.nnsbbs.user.logout();
    }));
    m.add(new Menu('Profile', () => {
      window.nnsbbs.user.profile();
    }));

  }

  set_logout_menu() {
    let m = this.menu_login;
    m.name = 'Login' + icon('caret-down-fill', 'right-icon')
    $('#' + m.id).html(m.name);
    m.clear();
    this.menu_login.add(new Menu('Login', () => {
      window.nnsbbs.user.login();
    }));
    this.menu_login.add(new Menu('User Registration', () => {
      window.nnsbbs.user.user_registration();
    }));
  }
}
