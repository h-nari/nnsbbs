import { div, input, tag, label, a, span, select, option, selected } from './tag';
import { api_membership, IMembership, IArticle, api_profile_write, api_login, api_profile_read, IUser, api_logout, api_theme_list, api_user_update, api_mail_auth, admin_api_article, api_user_attr, api_user_attr_set, NotifyPostValue } from './dbif';
import { INewsGroup } from "./newsgroup";
import { article_str, escape_html, form_input, form_textarea, get_json, set_i18n, url_link } from './util';
import { createHash } from 'sha1-uint8array';
import NnsBbs from './nnsbbs';
import { Attachment } from './attachemnt';
import './jconfirm';
import { Setting } from './setting';
import { PostData } from './postData';



export class User {
  public parent: NnsBbs;
  public user: IUser | undefined;
  public setting = new Setting(this);
  public membership: IMembership;

  constructor(parent: NnsBbs, membership: IMembership) {
    this.parent = parent;
    this.membership = membership;
  }

  login_dlg() {
    let i18next = this.parent.i18next;
    return new Promise((resolve, reject) => {
      var jc = $.confirm({
        title: i18next.t('login'),
        type: 'blue',
        columnClass: 'large',
        content: div({ class: 'login' },
          tag('form',
            div({ class: 'form-group row' },
              label({ for: 'email', class: 'col-sm-3 col-form-label' }, i18next.t('email')),
              div({ class: 'col-sm-6' }, input({ type: 'text', class: 'form-control', id: 'email', placeholder: 'email@example.com' }))),
            div({ class: 'form-group row' },
              label({ for: 'inputPassword', class: 'col-sm-3 col-form-label' }, i18next.t('password')),
              div({ class: 'col-sm-6' }, input({ type: 'password', class: 'form-control', id: 'inputPassword', placeholder: 'Password' })))),
          div({ class: 'login-links' },
            a({ href: '#', class: 'link-forget-password' }, i18next.t('forget-password')),
            a({ href: '#', class: 'link-user-registration' }, i18next.t('new-user-registration'))
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
                if (!data.login) {
                  $.alert(this.parent.i18next.t('login-failed'));
                  this.user = undefined;
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
        },
        onOpen: () => {
          $('.login .link-forget-password').on('click', () => {
            jc.close();
            this.user_registration_dlg('PASSWORD_RESET');
          });
          $('.login .link-user-registration').on('click', () => {
            jc.close();
            this.user_registration_dlg('MAIL_AUTH');
          });
        }
      });
    });
  }

  logout_dlg() {
    let i18next = this.parent.i18next;
    $.confirm({
      title: i18next.t('logout'),
      content: i18next.t('log-out?'),
      buttons: {
        logout: {
          text: i18next.t('logout'),
          action: async () => {
            await this.parent.beforeLogout();
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

  user_registration_dlg(action: 'MAIL_AUTH' | 'PASSWORD_RESET') {
    let i18next = this.parent.i18next;
    let bReg = action == 'MAIL_AUTH';
    let title = i18next.t(bReg ? 'user-registration' : 'password-reset');
    $.confirm({
      title,
      type: 'green',
      columnClass: 'large',
      content: div({ class: 'user-registration' },
        div({ class: 'explain' }, i18next.t(bReg ? 'enter-email-for-authentication' : 'enter-email-for-password-reset')),
        tag('form',
          div({ class: 'form-group row' },
            label({ for: 'email', class: 'col-sm-3 col-form-label' }, i18next.t('email')),
            div({ class: 'col-sm-6' },
              input({ type: 'text', class: 'form-control email', placeholder: 'email@example.com' }))))),
      buttons: {
        ok: {
          text: 'ok',
          action: () => {
            let email = $('.user-registration .email').val() as string;
            if (!email) {
              $.alert(i18next.t('input-email'));
              return false;
            } else if (!email.match(/[\w.]+@(\w+\.)+\w+/)) {
              $.alert(i18next.t('bad-format-email'));
              return false;
            } else {
              api_mail_auth(email, action).then(d => {
                let i18next = this.parent.i18next;
                if (d.result != 'ok') {
                  $.alert({
                    title: i18next.t('error'),
                    type: 'red',
                    columnClass: 'medium',
                    content: i18next.t(d.mes ? d.mes.trim() : 'failed')
                  });
                } else {
                  $.alert({
                    title: '',
                    type: 'green',
                    columnClass: 'medium',
                    content: i18next.t('sent-url')
                  });
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
      if (!await this.login_dlg()) return;
    }
    this.membership = await get_json('/api/membership') as IMembership;

    if (!this.user) return;
    let d = await api_profile_read(this.user.id);
    let c = tag('form', { class: 'edit-profile' },
      form_input('p-user-id', 'User ID', { value: this.user.id, readonly: null }),
      form_input('p-email', 'Email', { help: i18next.t('mail-used-to-register'), value: d.mail, readonly: null }),
      form_input('p-name', i18next.t('disp-name'), { help: i18next.t('displayed-as-username'), value: d.disp_name }),
      this.parent.conf.enable_access_control ?
        form_membership('p-membership', i18next.t('membership'), i18next.t('select-your-membership'), d.membership_id, this.membership) : '',
      form_textarea('p-profile', i18next.t('profile'),
        {
          help: i18next.t('fill-in-your-self-introduction'),
          value: d.profile, rows: 6
        }),
      form_textarea('p-signature', i18next.t('signature'), {
        help: i18next.t('signature-insert-into-article'),
        value: d.signature, rows: 3
      })
    );
    $.confirm({
      title: i18next.t('user-profile'),
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
              api_profile_write({ user_id, disp_name });
            if (this.parent.conf.enable_access_control) {
              let membership_id = $('#p-membership').val() as string;
              if (membership_id != d.membership_id) {
                api_profile_write({ user_id, membership_id });
                this.user.membership_id = membership_id;
              }
            }
            let profile = $('#p-profile').val() as string;
            if (profile != d.profile)
              api_profile_write({ user_id, profile });
            let signature = $('#p-signature').val() as string;
            if (signature != d.signature) {
              api_profile_write({ user_id, signature });
              this.user.signature = signature;
            }
          }
        },
        close: {
          text: i18next.t('close'),
          action: () => { }
        }
      }
    });
  }

  async post_article_dlg(n: INewsGroup, a: (IArticle | undefined) = undefined) {
    if (!this.user) {
      if (!await this.login_dlg()) return;
    }
    this.post_article_dlg0(new PostData(this, n, a));
  }

  async post_article_dlg0(postData: PostData) {
    const i18next = this.parent.i18next;

    if (!this.user) throw new Error('unexpected situation');
    if (Number(this.user.membership_id) < postData.newsgroup.n.wpl) {
      console.log('membership_id:', this.user.membership_id, 'wpl:', postData.newsgroup.n.wpl);
      let i18next = this.parent.i18next;
      $.alert({
        title: '',
        type: 'orange',
        columnClass: 'medium',
        content: i18next.t('no-permission-to-post')
      });
      return;
    }

    $.confirm({
      title: i18next.t('post-article'),
      columnClass: 'xlarge',
      type: 'orange',
      content: postData.form_html(),
      buttons: {
        ok: {
          text: this.parent.i18next.t('confirm'),
          action: () => {
            if (!postData.get_form_data()) return false;
            this.post_confirm_dlg(postData);
          },
          action2: () => {
            postData.post().then(r => {
              this.parent.ng_pane.curNode = undefined;
              this.parent.top_page(postData.newsgroup.n.name, r.article_id);
            });
          }
        },
        close: {
          text: this.parent.i18next.t('close'),
        }
      },
      onOpen: () => {
        set_i18n('.post-article');
        $('.btn-quote').on('click', () => {
          if (postData.article) this.quote_article('post-content', postData.newsgroup, postData.article);
        });
        $('.btn-attach').on('click', () => {
          this.attachment_dlg().then(list => {
            postData.attachment_list.push(...list);
            postData.redisplay_attachment_list();
          });
        });
        $('.btn-about-newsgroup').on('click', e => {
          if (this.parent.ng_pane.curNode)
            this.parent.ng_pane.curNode.about_newsgroup_dlg();
          e.stopPropagation();
          e.preventDefault();
        });
        postData.redisplay_attachment_list();
        let ta = $('#post-content')[0] as HTMLTextAreaElement;
        ta.setSelectionRange(0, 0);
      }
    });
  }

  post_confirm_dlg(postData: PostData) {
    const i18next = this.parent.i18next;
    $.confirm({
      title: i18next.t('confirm-article'),
      columnClass: 'xlarge',
      type: 'read',
      content: postData.confirm_html(),
      buttons: {
        ok: {
          text: i18next.t('post'),
          action: () => {
            postData.post().then(r => {
              this.parent.ng_pane.curNode = undefined;
              this.parent.top_page(postData.newsgroup.n.name, r.article_id);
            });
          }
        },
        back: {
          text: i18next.t('back-to-edit'),
          action: () => {
            this.post_article_dlg0(postData);
          }
        },
        close: {
          text: this.parent.i18next.t('close'),
        }
      },
      onOpen: () => {
        set_i18n('.post-article');
        $('.btn-about-newsgroup').on('click', e => {
          if (this.parent.ng_pane.curNode)
            this.parent.ng_pane.curNode.about_newsgroup_dlg();
          e.stopPropagation();
          e.preventDefault();
        });
        postData.redisplay_attachment_list();
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
        div({ class: 'profile' }, url_link(escape_html(d.profile))))
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
                for (let f of $('#upload-file').prop("files") as File[]) {
                  if (f.size > 100 * 1024 * 1024) {
                    let i18next = this.parent.i18next;
                    $.alert({
                      title: i18next.t('error'),
                      content: i18next.t('too-big-file-bigger-than-100m')
                    })
                    resolve([]);
                    return;
                  } else {
                    list.push(new Attachment(f));
                  }
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
    // var s = this.setting.duplicateData();
    if (!this.user) return;
    let attr = await api_user_attr(this.user.id);
    let theme_list = await api_theme_list();
    let c = select({ class: 'theme' }, ...theme_list.map(t => option({ value: t, selected: selected(this.user?.theme == t) }, t)))

    $.confirm({
      title: i18next.t('setting'),
      type: 'green',
      columnClass: 'large',
      content: div({ class: 'user-setting overflow-hidden' },
        div(div(i18next.t('theme')), div(c)),
        div({ class: 'row' },
          div(i18next.t('user-setting.notify-post')),
          div(select({ class: 'select-notifyPost' },
            option({ value: 'none', selected: selected(!attr.notifyPost || attr.notifyPost == 'none') }, i18next.t('user-setting.notify-post-none')),
            option({ value: '0', selected: selected(attr.notifyPost == '0') }, i18next.t('user-setting.notify-post-0am')),
            option({ value: '6', selected: selected(attr.notifyPost == '6') }, i18next.t('user-setting.notify-post-6am')),
            option({ value: '12', selected: selected(attr.notifyPost == '12') }, i18next.t('user-setting.notify-post-12am')),
            option({ value: '18', selected: selected(attr.notifyPost == '18') }, i18next.t('user-setting.notify-post-6pm'))
          )
          ))),
      onOpen: () => {
        set_i18n('.user-setting');
        $('.user-setting .theme').on('change', e => {
          let theme = $(e.currentTarget).val();
          let url = window.nnsbbs_baseURL + "theme/theme-" + theme + ".css";
          $('head link.theme ').attr('href', url)
        });
      },
      buttons: {
        write: {
          text: i18next.t('write'),
          action: async () => {
            if (!this.user) return;
            let id = this.user.id;
            let theme = $('.user-setting .theme').val() as string;
            if (this.user.theme != theme)
              await api_user_update({ id: this.user.id, theme });
            let notifyPost = $('.user-setting .select-notifyPost').val() as NotifyPostValue;
            console.log('notifyPost:', notifyPost);
            await api_user_attr_set(id, { notifyPost });
            location.reload();
          }
        },
        cancel: {
          text: i18next.t('cancel'),
        }
      }
    });
  }

  ban_article_dlg(newsgroup: INewsGroup, article: IArticle) {
    let i18next = this.parent.i18next;
    $.confirm({
      title: i18next.t('ban-article'),
      type: 'red',
      columnClass: 'medium',
      content: div({ class: 'article-ban-dlg' },
        div({ class: 'row' },
          div({ class: 'col-4 label' }, i18next.t('target-article'), ':'),
          div({ class: 'col-8 article-name' }, article_str(article))),
        div({ class: 'ban' },
          input({ id: 'ban-chk-btn', type: 'checkbox', checked: selected(article.bDeleted != 0) }),
          label({ for: 'ban-chk-btn' }, i18next.t('ban'))),
        div({ class: 'reason' },
          div({ class: 'label' }, i18next.t('delete-reason')),
          tag('textarea', { rows: 5 }, article.delete_reason)
        )
      ),
      buttons: {
        ok: {
          text: i18next.t('write'),
          action: async () => {
            let bDeleted = $('#ban-chk-btn').prop('checked') ? 1 : 0;
            let delete_reason = ($('.article-ban-dlg .reason textarea').val() || '') as string;
            await admin_api_article({
              newsgroup_id: article.newsgroup_id,
              id: article.article_id, bDeleted, delete_reason
            });
            this.parent.redisplay();
          }
        },
        cancel: { text: i18next.t('cancel') }
      }
    });
  }

  quote_article(id: string, n: INewsGroup, a: IArticle) {
    let c = $('#' + id).val();

    let qs = this.parent.i18next.t('user.quote-article', {
      article: n.n.name + ' / ' + a.article_id,
      author: a.author,
      datetime: a.date
    });
    qs += ':\n';

    for (let line of a.content.trim().split('\n'))
      qs += '> ' + line + '\n';

    let ta = $('#' + id)[0] as HTMLTextAreaElement;
    ta.setRangeText(qs);
  }

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


