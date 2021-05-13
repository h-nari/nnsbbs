interface StrObj {
  [key: string]: string | number | boolean | null | undefined;
}
type TagArg = string|number|StrObj|null|undefined;

export function tag(name: string, ...args: TagArg[]): string {
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
    if (attr[k] !== null) 
      html += '="' + attr[k] + '"';
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

export function div(...args: TagArg[]): string {
  return tag('div', ...args);
}
export function span(...args: TagArg[]): string {
  return tag('span', ...args);
}
export function img(...args: TagArg[]): string {
  return tag('img', ...args);
}
export function button(...args: TagArg[]): string {
  return tag('button', ...args);
}
export function input(...args: TagArg[]): string {
  return tag('input', ...args);
}
export function select(...args: TagArg[]): string {
  return tag('select', ...args);
}
export function option(...args: TagArg[]): string {
  return tag('option', ...args);
}
export function label(...args: TagArg[]): string {
  return tag('label', ...args);
}
export function ul(...args: TagArg[]): string {
  return tag('ul', ...args);
}
export function li(...args: TagArg[]): string {
  return tag('li', ...args);
}
export function a(...args: TagArg[]): string {
  return tag('a', ...args);
}
export function table(...args: TagArg[]): string {
  return tag('table', ...args);
}
export function tr(...args: TagArg[]): string {
  return tag('tr', ...args);
}
export function th(...args: TagArg[]): string {
  return tag('th', ...args);
}
export function td(...args: TagArg[]): string {
  return tag('td', ...args);
}
export function icon(name: string, opt_class: (string | null) = null) {
  let c = 'bi-' + name;
  if (opt_class)
    c += ' ' + opt_class;
  return tag('span', { class: c });
}

