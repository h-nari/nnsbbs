import { a, div, tag, icon, label, select, option, selected } from './tag';
import { Menu } from './menu';
import { escape_html, get_json } from './util';
import NnsBbs from './nnsbbs';

export class TopBar {
  private id = "TopBar";
  public parent: NnsBbs;
  public menu_login = new Menu('Login' + icon('caret-down-fill', 'right-icon'));

  constructor(parent: NnsBbs) {
    this.parent = parent;
  }

  html(): string {
    return tag('nav', { id: this.id, class: 'topbar' },
      a({ href: window.nnsbbs_baseURL }, 'NNSBBS'),
      this.menu_login.html())
  }

  bind() {
    this.menu_login.bind();
    this.check_login_status();
  }

  check_login_status() {
    return new Promise((resolve, reject) => {
      get_json('/api/session').then((d: any) => {
        if (d.login) {
          this.set_login_menu(d.name);
          this.parent.user.user = { id: d.user_id as string, name: d.name as string };
          resolve(true);
        }
        else {
          this.set_logout_menu();
          this.parent.user.user = null;
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
      this.parent.user.logout();
    }));
    m.add(new Menu('Profile', () => {
      this.parent.user.profile_dlg();
    }));
    m.add(new Menu('user-manager','/admin/user'));
    m.add(new Menu('newsgroup-manager','/admin/newsgroup'));
  }

  set_logout_menu() {
    let m = this.menu_login;
    m.name = 'Login' + icon('caret-down-fill', 'right-icon')
    $('#' + m.id).html(m.name);
    m.clear();
    this.menu_login.add(new Menu('Login', () => {
      this.parent.user.login();
    }));
    this.menu_login.add(new Menu('User Registration', () => {
      this.parent.user.user_registration();
    }));
  }
}
