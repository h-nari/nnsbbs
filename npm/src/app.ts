import NnsBbs from './nnsbbs';
import i18next from 'i18next';
import { jp } from './locale/jp';
import { en } from './locale/en';
import { div, span } from './tag';

declare global {
  interface Window {
    nnsbbs: NnsBbs;
    nnsbbs_baseURL: string;
  }
}

i18next.init({
  lng: 'jp',
  debug: true,
  resources: { en, jp }
});
let nb = new NnsBbs(i18next);
window.nnsbbs = nb;

$(window).on('keydown', e => {
  if (e.key == ' ') {
    window.nnsbbs.show_next();
    e.preventDefault();
    e.stopPropagation();
  }
});

window.onerror = function (message, source, lineno, colno, error) {
  $.alert({
    title: 'Javascript Error',
    type: 'red',
    columnClass: 'large',
    content: div({ class: 'global-error-dlg' },
      div({ class: 'message' }, message),
      div({ class: 'loc' },
        'at', span({ class: 'source' }, source),
        'line:', span({ class: 'lineno' }, lineno),
        ' col:', span({ class: 'colno' }, colno))
    )
  })
}
