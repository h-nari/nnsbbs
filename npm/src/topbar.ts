import { a, div, tag, icon, label, select, option, selected } from './tag';
import { Menu } from './menu';
import { escape_html, get_json } from './util';
import NnsBbs from './nnsbbs';
import { api_session } from './dbif';

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
      api_session().then(d => {
        if (d.login) {
          this.parent.user.user = d.user;
          this.parent.onLogin();
          // this.set_login_menu(d.user.disp_name);
          resolve(true);
        }
        else {
          this.parent.user.user = null;
          this.parent.onLogout();
          resolve(false);
        }
      });
    });
  }

  set_login_menu(username: string) {
    let i18next = this.parent.i18next;
    let m = this.menu_login;
    m.name = escape_html(username) + icon('caret-down-fill', 'right-icon')
    $('#' + m.id).html(m.name);
    m.clear();
    m.add(new Menu(i18next.t('logout'), () => {
      this.parent.user.logout();
    }));
    m.add(new Menu(i18next.t('Profile'), () => {
      this.parent.user.profile_dlg();
    }));
    m.add(new Menu(i18next.t('user-manager'), '/admin/user'));
    m.add(new Menu(i18next.t('newsgroup-manager'), '/admin/newsgroup'));
  }

  set_logout_menu() {
    let i18next = this.parent.i18next;
    let m = this.menu_login;
    m.name = i18next.t('login') + icon('caret-down-fill', 'right-icon ml-1')
    $('#' + m.id).html(m.name);
    m.clear();
    this.menu_login.add(new Menu(i18next.t('login'), () => {
      this.parent.user.login();
    }));
    this.menu_login.add(new Menu(i18next.t('User Registration'), () => {
      this.parent.user.user_registration();
    }));
  }
}
