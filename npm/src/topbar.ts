import { a, div, tag, icon, label, select, option, selected } from './tag';
import { Menu } from './menu';
import { escape_html, get_json } from './util';
import NnsBbs from './nnsbbs';
import { api_session } from './dbif';

export class TopBar {
  private id = "TopBar";
  public parent: NnsBbs;
  public menu_login = new Menu({ icon: 'caret-down-fill', icon_class: 'right-icon' });

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
    m.opt.name = escape_html(username)
    m.opt.icon = 'caret-down-fill';
    m.opt.icon_class = 'right-icon';
    $('#' + m.id).html(m.html());
    m.clear();
    m.add(new Menu({
      name: i18next.t('logout'),
      action: () => { this.parent.user.logout(); }
    }));
    m.add(new Menu({
      name: i18next.t('Profile'),
      action: () => { this.parent.user.profile_dlg(); }
    }));
    m.add(new Menu({ name: i18next.t('user-manager'), link: '/admin/user' }));
    m.add(new Menu({ name: i18next.t('newsgroup-manager'), link: '/admin/newsgroup' }));
  }

  set_logout_menu() {
    let i18next = this.parent.i18next;
    let m = this.menu_login;
    m.opt.name = i18next.t('login');
    m.opt.icon = 'caret-down-fill';
    m.opt.icon_class = 'right-icon ml-1';
    $('#' + m.id).html(m.html());
    m.clear();
    this.menu_login.add(new Menu({
      name: i18next.t('login'),
      action: () => { this.parent.user.login(); }
    })).add(new Menu({
      name: i18next.t('User Registration'),
      action: () => { this.parent.user.user_registration(); }
    }));
  }
}
