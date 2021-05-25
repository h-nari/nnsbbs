import { div, input, button, tag, label, a, span, select, option, selected, icon } from './tag';
import { api_membership, IMembership, api_post, api_attachment, IArticle, api_profile_write, api_login, api_profile_read, IUser, api_logout, api_theme_list, api_user_update } from './dbif';
import { INewsGroup } from "./newsgroup";
import { escape_html, get_json } from './util';
import { createHash } from 'sha1-uint8array';
import NnsBbs from './nnsbbs';
import { Attachment } from './attachemnt';
import i18next from 'i18next';


export class User {
  public parent: NnsBbs;
  public user: (IUser | null) = null;
  public membership: IMembership | null = null;

  constructor(parent: NnsBbs) {
    this.parent = parent;
  }

  login() {
    let i18next = this.parent.i18next;
    return new Promise((resolve, reject) => {
      $.confirm({
        title: i18next.t('login'),
        type: 'blue',
        columnClass: 'large',
        content: div({ class: 'login' },
          tag('form',
            div({ class: 'form-group row' },
              label({ for: 'email', class: 'col-sm-3 col-form-label' }, i18next.t('email') as string),
              div({ class: 'col-sm-6' }, input({ type: 'text', class: 'form-control', id: 'email', placeholder: 'email@example.com' }))),
            div({ class: 'form-group row' },
              label({ for: 'inputPassword', class: 'col-sm-3 col-form-label' }, i18next.t('password') as string),
              div({ class: 'col-sm-6' }, input({ type: 'password', class: 'form-control', id: 'inputPassword', placeholder: 'Password' })))),
          div({ class: 'login-links' },
            a({ href: '#' }, i18next.t('forget-password') as string),
            a({ href: '#' }, i18next.t('user-registration') as string)
          )),
        buttons: {
          login: {
            text: i18next.t('login'),
            action: () => {
              let email = $('#email').val() as string;
              let password = $('#inputPassword').val() as string;
              if (!email) {
                $.alert(i18next.t('input-email'));
                return false;
              }
              if (!password) {
                $.alert(i18next.t('no-password'));
                return false;
              }
              let sha = createHash('sha1');
              sha.update(password);
              let pwd = sha.digest('hex');
              api_login(email, pwd).then(data => {
                console.log('data:', data);
                if (!data.login) {
                  $.alert(this.parent.i18next.t('login-failed'));
                  this.user = null;
                  resolve(false);
                } else {
                  this.user = data.user;
                  this.parent.onLogin();
                  resolve(true);
                }
              });
            }
          },
          cancel: {
            text: i18next.t('cancel'),
            action: () => { resolve(false); }
          }
        }
      });
    });
  }

  logout() {
    let i18next = this.parent.i18next;
    $.confirm({
      title: i18next.t('logout'),
      content: i18next.t('log-out?'),
      buttons: {
        logout: {
          text: i18next.t('logout'),
          action: () => {
            this.parent.beforeLogout();
            api_logout().then(() => {
              this.parent.onLogout();
            });
          }
        },
        cancel: {
          text: i18next.t('cancel'),
          action: () => { }
        }
      }
    })
  }

  user_registration() {
    let i18next = this.parent.i18next;
    $.confirm({
      title: i18next.t('user-registration'),
      type: 'green',
      columnClass: 'large',
      content: div({ class: 'user-registration' },
        div({ class: 'explain' }, i18next.t('enter-email-for-authentication') as string),
        tag('form',
          div({ class: 'form-group row' },
            label({ for: 'email', class: 'col-sm-3 col-form-label' }, i18next.t('email') as string),
            div({ class: 'col-sm-6' },
              input({ type: 'text', class: 'form-control', id: 'email', placeholder: 'email@example.com' }))))),
      buttons: {
        ok: {
          text: 'ok',
          action: () => {
            let email: string = $('#email').val() as string;
            if (!email) {
              $.alert(i18next.t('input-email'));
              return false;
            } else if (!email.match(/[\w.]+@(\w+\.)+\w+/)) {
              $.alert(i18next.t('bad-format-email'));
              return false;
            } else {
              get_json('/api/mail_auth', { data: { email } }).then((d: any) => {
                if (d.result == 0) {
                  $.alert('failed:' + d.mes);
                  return false;
                } else {
                  $.alert(i18next.t('sent-url'));
                }
              }).catch(e => {
                $.alert(e);
              });
            }
          }
        },
        cancel: {
          text: 'cancel',
          action: () => { }
        }
      }
    });
  }

  async profile_dlg() {
    const i18next = this.parent.i18next;
    if (!this.user) {
      if (!await this.login()) return;
    }
    this.membership = await get_json('/api/membership') as IMembership;

    if (!this.user) return;
    let d = await api_profile_read(this.user.id);
    let c = tag('form', { class: 'edit-profile' },
      form_input('p-user-id', 'User ID', { value: this.user.id, readonly: null }),
      form_input('p-email', 'Email', { help: i18next.t('mail-used-to-register'), value: d.mail, readonly: null }),
      form_input('p-name', i18next.t('disp-name'), { help: i18next.t('displayed-as-username'), value: d.disp_name }),
      form_membership('p-membership', i18next.t('membership'), i18next.t('select-your-membership'), d.membership_id, this.membership),
      form_profile_textarea('p-profile', i18next.t('profile'),
        {
          help: i18next.t('fill-in-your-self-introduction'),
          value: d.profile, rows: 10
        })
    );
    $.confirm({
      title: 'User Profile',
      columnClass: 'xlarge',
      type: 'orange',
      content: c,
      buttons: {
        ok: {
          text: i18next.t('write'),
          action: () => {
            if (!this.user) return;
            let user_id = this.user.id;
            let disp_name = $('#p-name').val() as string;
            if (disp_name != d.disp_name)
              api_profile_write({ user_id, disp_name }).then(() => {
                this.parent.topBar.check_login_status();
              });
            let profile = $('#p-profile').val() as string;
            if (profile != d.profile)
              api_profile_write({ user_id, profile });
            let membership_id = $('#p-membership').val() as string;
            if (membership_id != d.membership_id)
              api_profile_write({ user_id, membership_id });
          }
        },
        close: {
          text: i18next.t('close'),
          action: () => { }
        }
      }
    });
  }

  async post_article_dlg(n: INewsGroup, a: (IArticle | null) = null, correctArticle: boolean = false) {
    const i18next = this.parent.i18next;
    var attachment_list: Attachment[] = [];
    if (!this.user) {
      if (!await this.login()) return;
    }

    if (!this.user) return;
    let title = '';
    let content = '';
    if (a) {
      if (correctArticle) {
        title = a.title;
      } else {
        if (a.title.match(/^Re:/)) title = a.title;
        else title = 'Re:' + a.title;
      }
    }


    let c = tag('form', { class: 'post-article' },
      form_input('post-name', i18next.t('disp-name'), { value: this.user.disp_name }),
      form_input('post-title', i18next.t('subject'), { value: title }),
      form_post_textarea('post-content', i18next.t('body'), a, { value: content, rows: 10 }),
      div({ class: 'attachment-area' }));
    $.confirm({
      title: i18next.t(correctArticle ? 'correct-article' : 'post-article'),
      columnClass: 'large',
      type: 'orange',
      content: c,
      buttons: {
        ok: {
          text: this.parent.i18next.t('post'),
          action: async () => {
            let user_id = this.user?.id || '';
            let newsgroup_id = n.n.id;
            let reply_to = a ? Number(a.article_id) : 0;
            let title = $('#post-title').val() as string;
            let disp_name = $('#post-name').val() as string;
            let content = $('#post-content').val() as string;
            if (title == '') return error_dlg('title-is-blank');
            if (disp_name == '') return error_dlg('name-is-blank');
            if (content == '') return error_dlg('content-is-blank');

            content = 'content-type: text/plain\n\n' + content;

            let r = await api_post({ newsgroup_id, user_id, disp_name, title, content, reply_to });
            if (attachment_list.length > 0) {
              let fd = new FormData();
              attachment_list.forEach(a => fd.append('file', a.file));
              fd.append('newsgroup_id', String(newsgroup_id));
              fd.append('article_id', r.article_id);
              let comments = attachment_list.map(a => a.comment);
              console.log('comments:', comments);
              fd.append('comments', JSON.stringify(comments));
              let r2 = await api_attachment(fd);
            }

            this.parent.top_page(n.n.name, r.article_id);

          }
        },
        close: {
          text: this.parent.i18next.t('close'),
          action: () => { }
        }
      },
      onOpen: () => {
        this.parent.set_i18n_text();
        $('.btn-quote').on('click', () => {
          if (a) quote_article('post-content', n, a);
        });
        $('.btn-attach').on('click', () => {
          const redisplay_func = () => {
            let htmls = attachment_list.map(a => a.html());
            $('.post-article .attachment-area').html(div(...htmls));
            this.parent.set_i18n_text();
            attachment_list.forEach(a => {
              a.bind();
              a.onDelete = () => {
                attachment_list = attachment_list.filter(b => b != a);
                redisplay_func();
              }
            });
          };
          this.attachment_dlg().then(list => {
            attachment_list.push(...list);
            redisplay_func();
          });
        });
      }
    });
  }

  t(id: string) {
    return this.parent.i18next.t(id);
  }

  async show_profile(user_id: string) {
    let d = await api_profile_read(user_id);
    if (!this.membership) this.membership = await api_membership();
    $.alert({
      title: this.t('show-profile'),
      type: 'green',
      columnClass: 'large',
      content: div({ class: 'show-profile' },
        div(
          div({ class: 'title' }, this.t('membership')),
          div({ class: 'membership' }, this.membership ? this.membership[d.membership_id].name : '')),
        div(
          div({ class: 'title' }, this.t('disp_name')),
          div({ class: 'disp-name' }, escape_html(d.disp_name))),
        div({ class: 'profile' }, escape_html(d.profile)))
    })
  }

  attachment_dlg(): Promise<Attachment[]> {
    let i18next = this.parent.i18next;
    return new Promise((resolve, reject) => {
      $.confirm({
        title: i18next.t('specify-attachments-images'),
        type: 'blue',
        columnClass: 'medium',
        content: tag('form',
          {
            method: 'POST', action: window.nnsbbs_baseURL + 'api/attachment',
            enctype: 'multipart/form-data', id: 'upload-form'
          },
          input({ type: 'file', name: 'upload', id: 'upload-file', multiple: null, placeholder: i18next.t('select-files') as string })
        ),
        buttons: {
          add: {
            text: 'Add',
            action: () => {
              let list: Attachment[] = []
              if ($('#upload-file').val()) {
                for (let f of $('#upload-file').prop("files")) {
                  list.push(new Attachment(f));
                }
              }
              resolve(list);
            }
          },
          cancel: {
            text: 'Cancel',
            action: () => {
              resolve([]);
            }
          }
        }
      });
    });
  }

  async setting_dlg() {
    let i18next = this.parent.i18next;
    let theme_list = await api_theme_list();
    let c = select({ class: 'theme' }, ...theme_list.map(t => option({ value: t, selected: selected(this.user?.theme == t) }, t)))

    $.confirm({
      title: i18next.t('setting'),
      type: 'green',
      columnClass: 'large',
      content: div({ class: 'user-setting overflow-hidden' },
        div({ class: 'row' },
          div({ class: 'col title', i18n: 'theme' }), div({ class: 'col value' }, c))),
      onOpen: () => { this.parent.set_i18n_text(); },
      buttons: {
        write: {
          text: i18next.t('write'),
          action: () => {
            if (!this.user) return;
            let id = this.user.id;
            let theme = $('.user-setting .theme').val() as string;
            api_user_update({ id: this.user.id, theme });
            location.reload();
          }
        },
        cancel: {
          text: i18next.t('cancel'),
        }
      }
    });
  }
}

interface IFormGroupOpt {
  help?: string;
  value?: string;
  placeholder?: string;
  readonly?: null;
  rows?: number;
};

function form_input(id: string, label_str: string, opt: IFormGroupOpt) {
  let input_part: string;
  input_part = input({
    id, type: 'text', readonly: opt.readonly, value: opt.value,
    class: 'form-control', placeholder: opt.placeholder
  });

  let help = '';
  if (opt.help)
    help = tag('small', { id: id + 'Help', class: 'form-text text-muted' }, opt.help);

  return div({ class: 'form-row' },
    label({ for: id, class: 'col col-md-2' }, label_str),
    div({ class: 'form-group col-md-9' }, input_part, help));
}

function form_profile_textarea(id: string, label_str: string, opt: IFormGroupOpt) {
  let input_part: string;
  input_part = tag('textarea', {
    id, rows: opt.rows, readonly: opt.readonly,
    class: 'form-control', placeholder: opt.placeholder
  }, opt.value || '');

  let help = '';
  if (opt.help)
    help = tag('small', { id: id + 'Help', class: 'form-text text-muted' }, opt.help);

  return div({ class: 'form-group' },
    div({ class: 'form-row' }, label({ for: id }, label_str), help),
    input_part);
}

function form_post_textarea(id: string, label_str: string, a: IArticle | null, opt: IFormGroupOpt) {
  let input_part: string;
  input_part = tag('textarea', {
    id, rows: opt.rows, readonly: opt.readonly,
    class: 'form-control', placeholder: opt.placeholder
  }, opt.value || '');
  let reply_btn = '';
  if (a)
    reply_btn = button({ class: 'btn ml-2 btn-quote', type: 'button', 'title-i18n': 'quote-article' },
      icon('chat-left-quote'));
  let attach_btn = button({ class: 'btn ml-auto btn-attach', type: 'button', 'title-i18n': 'attach-file' },
    icon('paperclip'));

  let help = '';
  if (opt.help)
    help = tag('small', { id: id + 'Help', class: 'form-text text-muted' }, opt.help);

  return div({ class: 'form-group' },
    div({ class: 'd-flex' },
      label({ for: id }, label_str), attach_btn, reply_btn),
    input_part, help);
}

function form_membership(id: string, label_str: string, help_str: string, value: string, membership: IMembership | null): string {
  let c = '';
  if (!membership) return div('no-membership');
  for (let id in membership) {
    let m = membership[id];
    if (m.selectable)
      c += option({ value: id, selected: selected(id == value) }, m.name);
  }
  return div({ class: 'form-group row' },
    label({ class: 'col-sm-2' }, label_str),
    div({ class: 'col-sm-9' },
      select({ id }, c),
      tag('small', { class: 'form-text text-muted' }, help_str))
  );
}


function quote_article(id: string, n: INewsGroup, a: IArticle) {
  let c = $('#' + id).val();
  let qs = 'In article ' + n.n.name + '/' + a.article_id + '\n';
  qs += a.author + ' writes:'
  qs += '\n';

  for (let line of a.content.trim().split('\n'))
    qs += '> ' + line + '\n';

  $('#' + id).val(c + '\n' + qs);
}

function error_dlg(msg: string): false {
  $.alert({
    title: 'post-error',
    content: msg,
    type: 'red'
  })
  return false;
}