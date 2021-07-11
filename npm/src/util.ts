import { IArticle } from "./dbif";
import { a, div, input, label, tag } from "./tag";


export function get_json(path: string, option = {}) {
  let opt = { url: path, type: "GET", dataType: "json" };
  for (let key in option)
    opt[key] = option[key];
  console.log("get_json:", path, JSON.stringify(option));
  let tStart = performance.now();
  return new Promise((resolve, reject) => {
    $('body').addClass('wait');
    opt['success'] = function (data, dataType) {
      console.log('get_json:', path, "succeeded.  time:", (performance.now() - tStart).toFixed(1), "ms");
      $('body').removeClass('wait');
      resolve(data);
    }
    opt['error'] = function (xhr, ts, es) {
      console.log('get_json:', path, "error.  time:", (performance.now() - tStart).toFixed(1), "ms");
      $('body').removeClass('wait');
      reject(es);
    }
    $.ajax(opt);
  });
}

export function escape_html(str: string | null | undefined): string {
  if (!str)
    return '';
  else
    return str.replace(/[&'`"<>]/g, function (match) {
      return {
        '&': '&amp;',
        "'": '&#X27;',
        '`': '&#x60;',
        '"': '&quot;',
        '<': '&lt;',
        '>': '&gt;'
      }[match] || '?' + match + '?';
    });
}

export function size_str(size: number): string {
  const kilo = 1024;
  const mega = kilo * kilo;
  const giga = mega * kilo;

  let str: string;
  if (size > giga)
    str = (size / giga).toFixed(2) + ' Gbyte';
  else if (size > 100 * mega)
    str = (size / mega).toFixed(0) + ' Mbyte'
  else if (size > 10 * mega)
    str = (size / mega).toFixed(1) + ' Mbyte'
  else if (size > 1 * mega)
    str = (size / mega).toFixed(2) + ' Mbyte'
  else if (size > 100 * kilo)
    str = (size / kilo).toFixed(0) + ' Kbyte'
  else if (size > 10 * kilo)
    str = (size / kilo).toFixed(1) + ' Kbyte'
  else if (size > 1 * kilo)
    str = (size / kilo).toFixed(2) + ' Kbyte'
  else
    str = size + ' bytes';
  return str;
}

export function nullstr(s: string | undefined | null): string {
  if (s) return s;
  else return '';
}

export function article_str(a: IArticle): string {
  return a.newsgroup + '/' + a.article_id + ' : ' + a.title;
}

export function set_i18n(selector: string = '') {
  let i18next = window.nnsbbs.i18next;
  $(selector + ' [i18n]').each(function () {
    let key = $(this).attr('i18n') || "no-key";
    let val = i18next.t(key);
    $(this).text(val);
  });
  $(selector + ' [html-i18n]').each(function () {
    let key = $(this).attr('html-i18n') || "no-key";
    let val = i18next.t(key);
    $(this).text(val);
  });
  $(selector + ' [title-i18n]').each(function () {
    let key = $(this).attr('title-i18n') || "no-key";
    let val = i18next.t(key);
    $(this).attr('title', val);
  });
  $(selector + ' [title]').tooltip({
    delay: 100,
    container: 'body',
    boundary: 'window',
  });
}

export function splitPath(path: string): { parent: string | null, base: string } {
  let i = path.indexOf('.');
  if (i < 0) return { parent: null, base: path };
  else return { parent: path.substring(0, i), base: path.substring(i + 1) };
}

export function url_link(content: string): string {
  const url_re = new RegExp('https?://([-a-zA-Z0-9._+\-,*#%\?/=~:@!]|(&amp;))+', 'g');
  let c2 = content.replace(url_re, (str) => {
    let url = str.replace('&amp;', '&');
    return a({ href: url, target: '_blank' }, decodeURI(url));
  });
  return c2;
}

export function error_dlg(msg: string): false {
  $.alert({
    title: window.nnsbbs.i18next.t('post-error'),
    content: window.nnsbbs.i18next.t(msg),
    type: 'red'
  })
  return false;
}

export interface IFormGroupOpt {
  help?: string;
  value?: string;
  placeholder?: string;
  readonly?: null;
  rows?: number;
};

export function form_input(id: string, label_str: string, opt: IFormGroupOpt) {
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
    div({ class: 'form-group col-md-10' }, input_part, help));
}

export function form_textarea(id: string, label_str: string, opt: IFormGroupOpt) {
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
