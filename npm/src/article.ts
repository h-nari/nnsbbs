import { escape_html, size_str, url_link } from "./util";
import { div, span, img, tag } from "./tag";
import { ToolbarPane } from "./pane";
import NnsBbs from "./nnsbbs";
import { api_article, IArticle } from "./dbif";

const scroller = '#article .article';
const end = scroller + " .article-end";

export class ArticlePane extends ToolbarPane {
  private id_header: string;
  public article: IArticle | null = null;
  private bDispHeader = false;               // Flag to display the header section of the article.
  public fNext: (() => void) | null = null;  // invoked when end part clicked

  constructor(id: string, parent: NnsBbs) {
    super(id, parent);
    this.id_header = this.id + "-header";
    this.clear();
    this.toolbar.title = 'Article';
  }

  clear() {
    this.article = null;
  }

  html(): string {
    return div({ id: this.id }, this.inner_html());
  }

  inner_html(): string {
    let d = this.article;

    if (d) {
      let attachment = '';
      for (let a of d.attachment) {
        let url = window.nnsbbs_baseURL + 'attachment/' + a.file_id;
        if (a.content_type.startsWith('image/')) {
          attachment += div({ class: 'image' },
            div(tag('a', { href: url }, img({ src0: url }))),
            div({ class: 'comment' }, a.comment));
        } else {
          attachment += div({ class: 'attached-file' },
            div(tag('a', { href: url },
              span({ class: 'filename' }, a.filename),
              span({ class: 'size' }, size_str(a.size)))),
            div({ class: 'comment' }, escape_html(a.comment)));
        }
      }

      let content = d.content;
      content = escape_html(d.content);
      content = url_link(content);

      return this.toolbar.html() +
        div({ class: 'article' },
          div({ class: 'article-header', id: this.id_header }, escape_html(d.header)),
          div({ class: 'article-body' }, content),
          div(attachment),
          div({ class: 'article-end', 'html-i18n': 'end-click-to-next' }, "--- End (click to next)---"));
    } else {
      return this.toolbar.html();
    }
  }

  bind() {
    super.bind();
    if (!this.bDispHeader)
      $('#' + this.id_header).addClass('no-display');
    $(`#${this.id} .article-end`).on('click', () => {
      if (this.fNext) this.fNext();
    });
    $(`#${this.id} .toolbar-title .author`).on('click', ev => {
      if (this.article)
        this.parent.user.show_profile(this.article.user_id);
    });

    let imgs = $(`#${this.id} .article .image IMG`);
    for (let i = 0; i < imgs.length; i++) {
      let img = imgs[i] as HTMLImageElement;
      img.onload = e => {
        let nw = img.naturalWidth;
        let nh = img.naturalHeight;
        let w = img.width;
        let h = img.height;
        let sx = w / nw;
        let sy = h / nh;
        let ss = Math.min(sx);
        $(img).attr('style', `width: ${ss * nw}px; height: ${ss * nh}px;`);
      };
      $(img).attr('src', $(img).attr('src0') || '');
      $(img).removeAttr('src0');
    }
  }

  redisplay() {
    $('#' + this.id).html(this.inner_html());
    this.bind();
  }

  async open(newsgroup_id: string, id: string) {
    let data = await api_article(newsgroup_id, id);
    let c = data.content;
    let i = c.indexOf('\n\n');
    if (i >= 0) {
      data['header'] = c.substring(0, i);
      data['content'] = c.substring(i + 2);
    } else {
      data['header'] = "";
    }
    this.article = data;
    this.toolbar.title =
      span({ class: 'id' }, '[' + id + ']') +
      span({ class: 'author', 'title-i18n': 'show-profile' }, escape_html(data.author)) +
      span({ class: 'date' }, data.date) +
      span({ class: 'title' }, escape_html(data.title));
  }

  setHeaderDisp(bDisp: boolean) {
    if (bDisp)
      $('#' + this.id_header).removeClass('no-display');
    else
      $('#' + this.id_header).addClass('no-display');
    this.bDispHeader = bDisp;
  }

  toggle_header() {
    this.setHeaderDisp(!this.bDispHeader);
  }

  scrolled_to_end() {
    let sy = $(scroller).scrollTop() || 0;
    let h = $(scroller).height() || 0;
    let y = $(end).position().top;
    let eh = $(end).height() || 0;
    return y + eh < h;
  }

  scroll() {
    let h = $(scroller).height() || 0;
    let sy = $(scroller).scrollTop() || 0;
    $(scroller).scrollTop(sy + h - 20);
  }
}