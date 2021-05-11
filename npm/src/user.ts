import { div, input, button, tag, label, a, span, select, option, selected, icon } from './tag';
import { api_membership, IMembership, api_post, api_attachment, IArticle, api_profile_write, api_login, api_profile_read, IUser, api_logout } from './dbif';
import { INewsGroup } from "./newsgroup";
import { escape_html, get_json } from './util';
import { createHash } from 'sha1-uint8array';
import NnsBbs from './nnsbbs';
import { Attachment } from './attachemnt';


export class User {
  public parent: NnsBbs;
  public user: (IUser | null) = null;
  public membership: IMembership | null = null;

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
              let data = await api_login(email, pwd);
              if (!data.login) {
                $.alert(this.parent.i18next.t('login-failed'));
                this.user = null;
                resolve(false);
              } else {
                this.user = data.user;
                this.parent.onLogin();
                resolve(true);
              }
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
            this.parent.beforeLogout();
            api_logout().then(() => {
              this.parent.onLogout();
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

  async profile_dlg() {
    if (!this.user) {
      if (!await this.login()) return;
    }
    this.membership = await get_json('/api/membership') as IMembership;

    if (!this.user) return;
    let d = await api_profile_read(this.user.id);
    let c = tag('form', { class: 'edit-profile' },
      form_input('p-user-id', 'User ID', { value: this.user.id, readonly: null }),
      form_input('p-email', 'Email', { help: '登録に使用したメールアドレス', value: d.mail, readonly: null }),
      form_input('p-name', '表示名', { help: 'ユーザ名として表示されます', value: d.disp_name }),
      form_membership('p-membership', '党員資格', '党員資格を選択して下さい', d.membership_id, this.membership),
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
          text: '閉じる',
          action: () => { }
        }
      }
    });
  }

  async post_article_dlg(n: INewsGroup, a: (IArticle | null) = null) {
    var attachment_list: Attachment[] = [];
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
      form_post_textarea('post-content', '本文', a, { value: content, rows: 10 }),
      div({ class: 'attachment-area' }));
    $.confirm({
      title: '記事投稿',
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
        // $('.post-article [title]').tooltip();
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
                console.log('before delete:', attachment_list);
                attachment_list = attachment_list.filter(b => b != a);
                console.log('after delete:', attachment_list);
                redisplay_func();
              }
            });
          };
          this.attachment_dlg().then(list => {
            console.log('list:', list);
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
    return new Promise((resolve, reject) => {
      $.confirm({
        title: '添付ファイル/画像の指定',
        type: 'blue',
        columnClass: 'medium',
        content: tag('form',
          {
            method: 'POST', action: window.nnsbbs_baseURL + 'api/attachment',
            enctype: 'multipart/form-data', id: 'upload-form'
          },
          input({ type: 'file', name: 'upload', id: 'upload-file', multiple: null, placeholder: 'ファイルを選択して下さい' })
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
      tag('small', { class: 'form-text text-muted' }, '党員資格を選択してください'))
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