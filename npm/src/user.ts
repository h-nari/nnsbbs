import { div, input, button, tag, label, a, span, select, option, selected } from './tag';
import { escape_html, get_json } from './util';
import { createHash } from 'sha1-uint8array';
import { INewsGroup } from './newsgroup';
import { IArticle } from './article';
import NnsBbs from './nnsbbs';

interface IUser {
  id: string;
  name: string;
};

interface IProfile {
  mail: string,
  disp_name: string,
  created_at: string,
  logined_at: string,
  membership: string,
  profile: string
};

export class User {
  public parent: NnsBbs;
  public user: (IUser | null) = null;

  constructor(parent: NnsBbs) {
    this.parent = parent;
  }

  login() {
    return new Promise((resolve, reject) => {
      $.confirm({
        title: 'Login',
        type: 'blue',
        columnClass: 'large',
        content: div({ class: 'login' },
          tag('form',
            div({ class: 'form-group row' },
              label({ for: 'email', class: 'col-sm-3 col-form-label' }, 'Email'),
              div({ class: 'col-sm-6' }, input({ type: 'text', class: 'form-control', id: 'email', placeholder: 'email@example.com' }))),
            div({ class: 'form-group row' },
              label({ for: 'inputPassword', class: 'col-sm-3 col-form-label' }, 'Password'),
              div({ class: 'col-sm-6' }, input({ type: 'password', class: 'form-control', id: 'inputPassword', placeholder: 'Password' })))),
          div({ class: 'login-links' },
            a({ href: '#' }, 'forget Password'),
            a({ href: '#' }, 'User registration'),
            a({ href: '#' }, 'merits of user registration')
          )),
        buttons: {
          login: {
            text: 'Login',
            action: async () => {
              let email = $('#email').val() as string;
              let password = $('#inputPassword').val() as string;
              let sha = createHash('sha1');
              sha.update(password);
              let pwd = sha.digest('hex');
              let data: any = await get_json('/api/login', { data: { email, pwd } });
              if (!data.login) {
                let n = this.parent.i18next;
                $.alert(n.t('login-failed'));
              }
              let r = await this.parent.topBar.check_login_status();
              resolve(r);
            }
          },
          cancel: {
            text: 'Cancel',
            action: () => { resolve(false); }
          }
        }
      });
    });
  }

  logout() {
    $.confirm({
      title: 'Logout',
      content: 'Are you sure you want to log out?',
      buttons: {
        logout: {
          text: 'Logout',
          action: () => {
            get_json('/api/logout').then(() => {
              this.parent.topBar.check_login_status();
            });
          }
        },
        cancel: {
          text: 'Cancel',
          action: () => { }
        }
      }
    })
  }

  user_registration() {
    $.confirm({
      title: 'User registration',
      type: 'green',
      columnClass: 'large',
      content: div({ class: 'user-registration' },
        div({ class: 'explain' },
          'Please enter your email address for authentication.',
          '  A URL for authentication will be sent to the address you entered.'),
        tag('form',
          div({ class: 'form-group row' },
            label({ for: 'email', class: 'col-sm-3 col-form-label' }, 'Email'),
            div({ class: 'col-sm-6' },
              input({ type: 'text', class: 'form-control', id: 'email', placeholder: 'email@example.com' }))))),
      buttons: {
        ok: {
          text: 'ok',
          action: () => {
            let email: string = $('#email').val() as string;
            if (!email) {
              $.alert('Please enter your email address');
              return false;
            } else if (!email.match(/[\w.]+@(\w+\.)+\w+/)) {
              $.alert('The email address format is incorrect.');
              return false;
            } else {
              get_json('/api/mail_auth', { data: { email } }).then((d: any) => {
                if (d.result == 0) {
                  $.alert('failed:' + d.mes);
                  return false;
                } else {
                  $.alert(div('An authentication URL has been sent to the email address you entered.') +
                    div('Please open the email and open the URL for authentication with your browser.'));
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

  async profile() {
    if (!this.user) {
      if (!await this.login()) return;
    }
    if (!this.user) return;
    let d = await get_json('/api/profile_read', { data: { user_id: this.user.id } }) as IProfile;
    let c = tag('form', { class: 'edit-profile' },
      form_input('p-user-id', 'User ID', { value: this.user.id, readonly: null }),
      form_input('p-email', 'Email', { help: '登録に使用したメールアドレス', value: d.mail, readonly: null }),
      form_input('p-name', '表示名', { help: 'ユーザ名として表示されます', value: d.disp_name }),
      form_membership('p-membership', '党員資格', '党員資格を選択して下さい', d.membership),
      form_profile_textarea('p-profile', 'プロファイル',
        {
          help: '自己紹介を記入して下さい。ここに書かれた内容は公開されますので注意して下さい。',
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
          text: '書込み',
          action: () => {
            if (!this.user) return;
            let disp_name = $('#p-name').val() || '';
            if (disp_name != d.disp_name)
              get_json('/api/profile_write', { method: 'post', data: { user_id: this.user.id, name: disp_name } }).then(() => {
                this.parent.topBar.check_login_status();
              });
            let profile = $('#p-profile').val() || '';
            if (profile != d.profile)
              get_json('/api/profile_write', { method: 'post', data: { user_id: this.user.id, profile } });
            let membership = $('#p-membership').val() || '';
            if (membership != d.membership)
              get_json('/api/profile_write', { method: 'post', data: { user_id: this.user.id, membership } });
          }
        },
        close: {
          text: '閉じる',
          action: () => { }
        }
      }
    });
  }

  async post_article(n: INewsGroup, a: (IArticle | null) = null) {
    if (!this.user) {
      if (!await this.login()) return;
    }

    if (!this.user) return;
    let title = '';
    let content = '';
    if (a) {
      if (a.title.match(/^Re:/)) title = a.title;
      else title = 'Re:' + a.title;
    }

    let c = tag('form', { class: 'post-article' },
      form_input('post-name', '表示名', { value: this.user.name }),
      form_input('post-title', '表題', { value: title }),
      form_post_textarea('post-content', '本文', a, { value: content, rows: 10 }));
    $.confirm({
      title: '記事投稿',
      columnClass: 'large',
      type: 'orange',
      content: c,
      buttons: {
        ok: {
          text: '投稿',
          action: () => {
            let user_id = this.user?.id;
            let newsgroup_id = n.id;
            let reply_to = a ? a.article_id : 0;
            let title = $('#post-title').val() || '';
            let disp_name = $('#post-name').val() || '';
            let content = $('#post-content').val() || '';

            if (title == '') return error_dlg('title-is-blank');
            if (disp_name == '') return error_dlg('name-is-blank');
            if (content == '') return error_dlg('content-is-blank');

            content = 'content-type: text/plain\n\n' + content;

            get_json('/api/post', {
              method: 'post',
              data: {
                newsgroup_id, user_id,
                disp_name, title, content, reply_to
              }
            }).then((d: any) => {
              this.parent.top_page(n.name, d.article_id);
              $.alert('投稿に成功しました')
            }).catch(e => {
              $.alert('投稿に失敗しました');
            });
          }
        },
        close: {
          text: '閉じる',
          action: () => { }
        }
      },
      onOpen: () => {
        this.parent.set_i18n_text();
        // $('.post-article [title]').tooltip();
        $('.btn-quote').on('click', () => {
          if (a) quote_article('post-content', n, a);
        });
      }
    });
  }

  t(id: string) {
    return this.parent.i18next.t(id);
  }

  async show_profile(user_id: string) {
    let d = await get_json('/api/profile_read', { data: { user_id } }) as IProfile;
    $.alert({
      title: this.t('show-profile'),
      type: 'green',
      columnClass: 'large',
      content: div({ class: 'show-profile' },
        div(
          div({ class: 'title' }, this.t('membership')),
          div({ class: 'membership' }, membership[d.membership])),
        div(
          div({ class: 'title' }, this.t('disp_name')),
          div({ class: 'disp-name' }, escape_html(d.disp_name))),
        div({ class: 'profile' }, escape_html(d.profile)))
    })
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
    reply_btn = button({ class: 'btn ml-auto btn-quote', type: 'button', 'title-i18n': 'quote-article' },
      span({ class: 'bi-chat-left-quote' }));

  let help = '';
  if (opt.help)
    help = tag('small', { id: id + 'Help', class: 'form-text text-muted' }, opt.help);

  return div({ class: 'form-group' },
    div({ class: 'd-flex' },
      label({ for: id }, label_str), reply_btn),
    input_part, help);
}

const membership = ['党員外', '参政党 サポーター', '参政党 一般党員', '参政党 運営党員'];

function form_membership(id: string, label_str: string, help_str: string, value: string): string {
  let c = '';
  for (let idx in membership) {
    let m = membership[idx];
    let v = String(idx);
    c += option({ value: v, selected: selected(v == value) }, m);
  }
  return div({ class: 'form-group row' },
    label({ class: 'col-sm-2' }, label_str),
    div({ class: 'col-sm-9' },
      select({ id }, c),
      tag('small', { class: 'form-text text-muted' }, '党員資格を選択してください'))
  );
}


function quote_article(id: string, n: INewsGroup, a: IArticle) {
  let c = $('#' + id).val();
  let qs = 'In article ' + n.name + '/' + a.article_id + '\n';
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