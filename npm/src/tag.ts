interface StrObj {
  [key: string]: string | number | boolean | null | undefined;
}

export function tag(name: string, ...args: (string | number | StrObj)[]): string {
  let attr: StrObj = {};
  let html: string = '<' + name;
  for (let a of args) {
    if (typeof a == 'object') {
      for (let k in a) {
        if (k in attr)
          attr[k] += ' ' + a[k];
        else
          attr[k] = a[k];
      }
    }
  }
  for (let k in attr) {
    if (attr[k] === undefined)
      continue;
    html += ' ' + k;
    if (attr[k] !== null) {
      html += '="' + attr[k] + '"';
      html += k + "=" + attr[k];
    }
  }
  html += '>';
  for (let a of args) {
    if (typeof a == 'string')
      html += a;
    else if (typeof a == 'number')
      html += String(a);
  }
  html += '</' + name + '>';
  return html;
}



export function selected(b: boolean): null | undefined {
  return b ? null : undefined;
}

export function div(...args: (string | number | StrObj)[]): string {
  return tag('div', ...args);
}
export function span(...args: (string | number | StrObj)[]): string {
  return tag('span', ...args);
}
export function img(...args: (string | number | StrObj)[]): string {
  return tag('img', ...args);
}
export function button(...args: (string | number | StrObj)[]): string {
  return tag('button', ...args);
}
export function input(...args: (string | number | StrObj)[]): string {
  return tag('input', ...args);
}
export function select(...args: (string | number | StrObj)[]): string {
  return tag('select', ...args);
}
export function option(...args: (string | number | StrObj)[]): string {
  return tag('option', ...args);
}
export function label(...args: (string | number | StrObj)[]): string {
  return tag('label', ...args);
}
export function ul(...args: (string | number | StrObj)[]): string {
  return tag('ul', ...args);
}
export function li(...args: (string | number | StrObj)[]): string {
  return tag('li', ...args);
}
export function a(...args: (string | number | StrObj)[]): string {
  return tag('a', ...args);
}
export function icon(name: string, opt_class: (string | null) = null) {
  let c = 'bi-' + name;
  if (opt_class)
    c += ' ' + opt_class;
  return tag('span', { class: c });
}

