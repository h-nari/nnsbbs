// import printf = require('printf');

interface StrObj {
    [key: string]: string | number | boolean;
}

export function tag(name: string, ...args: (string | StrObj)[]): string {
    let attr: StrObj = {};
    let html: string = '<' + name;
    for (let a of args) {
        if (typeof a != 'string') {
            for (let k in a) {
                if (k in attr)
                    attr[k] += ' ' + a[k];
                else
                    attr[k] = a[k];
            }
        }
    }
    for (let k in attr) {
        html += ' ' + k;
        html += '="' + attr[k] + '"';
        html += k + "=" + attr[k];
    }
    html += '>';
    for (let a of args) {
        if (typeof a == 'string')
            html += a;
    }
    html += '</' + name + '>';
    return html;
}

export function div(...args: (string | StrObj)[]): string {
    return tag('div', ...args);
}
export function span(...args: (string | StrObj)[]): string {
    return tag('span', ...args);
}
export function img(...args: (string | StrObj)[]): string {
    return tag('img', ...args);
}
export function button(...args: (string | StrObj)[]): string {
    return tag('button', ...args);
}
export function input(...args: (string | StrObj)[]): string {
    return tag('input', ...args);
}
export function select(...args: (string | StrObj)[]): string {
    return tag('select', ...args);
}
export function option(...args: (string | StrObj)[]): string {
    return tag('option', ...args);
}
export function label(...args: (string | StrObj)[]): string {
  return tag('label', ...args);
}
export function ul(...args: (string | StrObj)[]): string {
  return tag('ul', ...args);
}
export function li(...args: (string | StrObj)[]): string {
  return tag('li', ...args);
}


