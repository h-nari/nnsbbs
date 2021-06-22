import { a, div, tag, icon, label, select, option, selected } from './tag';
import { Menu } from './menu';
import { escape_html, get_json } from './util';
import NnsBbs from './nnsbbs';
import { admin_api_report_count, admin_api_report_list, api_session } from './dbif';

export class TopBar {
  private id = "TopBar";
  public parent: NnsBbs;
  public menu_login = new Menu();
  public menu_report_manager: Menu | undefined;
  public bModerator: boolean = false;

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
    let user = this.parent.user.user;
    if (user)
      this.set_login_menu(user.disp_name);
    else
      this.set_logout_menu();
  }

  set_login_menu(username: string) {
    let i18next = this.parent.i18next;
    let m = this.menu_login;
    m.opt.name = escape_html(username)
    m.opt.right_icon = 'caret-down-fill';
    m.opt.right_icon_class = 'right-icon';
    $('#' + m.id).html(m.html());
    m.clear();
    m.add(new Menu({
      name: i18next.t('logout'),
      action: () => { this.parent.user.logout_dlg(); }
    }));
    m.addSeparator();
    m.add(new Menu({
      name: i18next.t('Profile'),
      action: () => { this.parent.user.profile_dlg(); }
    }));
    m.add(new Menu({
      name: i18next.t('setting'),
      action: () => { this.parent.user.setting_dlg(); }
    }));
    if (this.parent.user.user?.moderator) {
      this.bModerator = true;
      m.addSeparator();
      m.add(new Menu({ name: i18next.t('user-manager'), link: '/admin/user' }));
      m.add(new Menu({ name: i18next.t('newsgroup-manager'), link: '/admin/newsgroup' }));
      this.menu_report_manager = new Menu({ name: i18next.t('report-manager'), link: '/admin/report' });
      m.add(this.menu_report_manager);
      m.addSeparator();
      m.add(new Menu({
        name: i18next.t('db-check-and-repair'),
        action: () => { this.parent.newsgroupAdmin.db_check_and_repair_dlg(); }
      }));
    } else {
      this.bModerator = false;
    }
    this.update_badge();
  }

  set_logout_menu() {
    let i18next = this.parent.i18next;
    let m = this.menu_login;
    m.opt.name = i18next.t('login');
    m.opt.right_icon = 'caret-down-fill';
    m.opt.right_icon_class = 'right-icon ml-1';
    $('#' + m.id).html(m.html());
    m.clear();
    this.menu_login.add(new Menu({
      name: i18next.t('login'),
      action: () => { this.parent.user.login_dlg(); }
    })).add(new Menu({
      name: i18next.t('User Registration'),
      action: () => { this.parent.user.user_registration_dlg('MAIL_AUTH'); }
    }));
    this.bModerator = false;
    this.update_badge();
  }

  async update_badge() {
    let badge = '';
    if (this.parent.user.user?.moderator) {
      let d = await admin_api_report_count({ treatments: [0] });
      if (this.bModerator && d.count > 0)
        badge = String(d.count);
    }

    this.menu_login.opt.badge = badge;
    this.menu_login.redisplay();

    if (this.menu_report_manager) {
      this.menu_report_manager.opt.badge = badge;
      this.menu_report_manager.redisplay();
    }
  }
}
