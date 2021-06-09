import { IArticle } from "./dbif";


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

export function make_rev_id(article_id: string, rev: number): string {
  if (typeof (rev) != 'number')
    throw new Error('rev is not number!');
  return rev == 0 ? article_id : article_id + '.' + rev;
}

export function split_rev_id(rev_id: string): { article_id: string, rev: number } {
  let m = rev_id.match(/^(\d+)\.(\d+)$/);
  if (m) return { article_id: m[1], rev: parseInt(m[2]) };
  m = rev_id.match(/^\d+$/);
  if (m) return { article_id: rev_id, rev: 0 };
  throw new Error('bad format rev_id:' + rev_id);
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
    delay: 500
  });
}