// 投稿する記事のデータを保持するクラス

import { Attachment } from "./attachemnt";
import { api_attachment, api_post, IArticle, IPostArg } from "./dbif";
import { INewsGroup } from "./newsgroup";
import { button, div, icon, input, label, tag } from "./tag";
import { User } from "./user";
import { error_dlg, escape_html, form_input, IFormGroupOpt, set_i18n, url_link } from "./util";

export class PostData {
  public user: User;
  public newsgroup: INewsGroup;
  public article: IArticle | undefined;
  public attachment_list: Attachment[] = [];
  public title: string;
  public content: string;
  public disp_name: string;
  public reply_to: string;
  public content_type = 'text/plain';

  constructor(user: User, newsgroup: INewsGroup, article: IArticle | undefined = undefined) {
    this.user = user;
    this.newsgroup = newsgroup;
    this.article = article;
    if (!user.user) throw new Error('Unexpected situation');
    if (article) {
      if (article.title.match(/^Re:/)) this.title = article.title;
      else this.title = 'Re:' + article.title;
      this.content = user.user.signature;
      this.reply_to = article.article_id;
    } else {
      this.title = '';
      this.content = user.user.signature;
      this.reply_to = '';
    }
    this.disp_name = user.user.disp_name;
  }

  bind(type: 'form' | 'confirm') {
    if (type == 'form') {

    }
  }

  form_html(): string {
    let i18next = this.user.parent.i18next;
    return tag('form', { class: 'post-article' },
      div({ class: 'row my-2' },
        label({ class: 'col-2' }, i18next.t('newsgroup')),
        div({ class: 'col-8 font-weight-bold' }, this.newsgroup.n.name),
        div({ class: 'col-2' }, button({ class: 'btn btn-info btn-about-newsgroup w-100' }, i18next.t('newsgroup-description')))),
      form_input('post-name', i18next.t('disp-name'), { value: this.disp_name }),
      form_input('post-title', i18next.t('subject'), { value: this.title }),
      form_post_textarea('post-content', i18next.t('body'), this.article, { value: this.content, rows: 10 }),
      div({ class: 'attachment-area' }));
  }

  confirm_html(): string {
    let i18next = this.user.parent.i18next;
    return tag('div', { class: 'post-article' },
      div({ class: 'row my-1' },
        label({ class: 'col-2' }, i18next.t('newsgroup')),
        div({ class: 'col-8 font-weight-bold' }, this.newsgroup.n.name),
        div({ class: 'col-2' }, button({ class: 'btn btn-info btn-about-newsgroup w-100' }, i18next.t('newsgroup-description')))),
      div({ class: 'row my-1' },
        div({ class: 'col-2' }, i18next.t('disp-name')),
        div({ class: 'col-10' }, escape_html(this.disp_name))),
      div({ class: 'row my-1' },
        div({ class: 'col-2' }, i18next.t('subject')),
        div({ class: 'col-10' }, escape_html(this.title))),
      div({ class: 'content' }, div(i18next.t('content')), div({ class: 'text' }, url_link(escape_html(this.content)))),
      div({ class: 'attachment-area' }));
  }

  redisplay_attachment_list() {
    let htmls = this.attachment_list.map(a => a.html());
    $('.post-article .attachment-area').html(div(...htmls));
    set_i18n();
    this.attachment_list.forEach(a => {
      a.bind();
      a.onDelete = () => {
        this.attachment_list = this.attachment_list.filter(b => b != a);
        this.redisplay_attachment_list();
      }
    });
  }

  get_form_data(): boolean {
    this.title = $('#post-title').val() as string;
    this.disp_name = $('#post-name').val() as string;
    this.content = $('#post-content').val() as string;
    if (this.title == '') return error_dlg('title-is-blank');
    if (this.disp_name == '') return error_dlg('name-is-blank');
    if (this.content == '') return error_dlg('content-is-blank');
    return true;
  }

  async post() {
    let user_id = this.user.user?.id || '';
    let newsgroup_id = this.newsgroup.n.id;
    let content = `content-type: ${this.content_type}\n\n${this.content}`;

    let postArg: IPostArg = { newsgroup_id, user_id, disp_name: this.disp_name, title: this.title, content, reply_to: this.reply_to };
    let r = await api_post(postArg);
    if (this.attachment_list.length > 0) {
      let fd = new FormData();
      this.attachment_list.forEach(a => {
        if (a.file)
          fd.append('file', a.file);
      });
      fd.append('newsgroup_id', newsgroup_id);
      fd.append('article_id', r.article_id);
      let attach = this.attachment_list.map(a => a.data());
      fd.append('attach', JSON.stringify(attach));
      api_attachment(fd);
    }
    return r;
  }
}

function form_post_textarea(id: string, label_str: string, a: IArticle | undefined, opt: IFormGroupOpt) {
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
    div({ class: 'd-flex post-buttons' },
      label({ for: id }, label_str), attach_btn, reply_btn),
    input_part, help);
}

