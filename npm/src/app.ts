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

declare var init_data: any;

i18next.init({
  lng: 'jp',
  debug: true,
  resources: { en, jp }
});
let nb = new NnsBbs(i18next, init_data);
window.nnsbbs = nb;

$(() => {
  var tb = window.nnsbbs.topBar;
  $('#whole-page').prepend(tb.html());
  tb.bind();
});


$(window).on('keydown', e => {
  if ($(e.target).prop('tagName') == 'BODY') {
    if (e.key == ' ') {
      window.nnsbbs.show_next();
      e.preventDefault();
      e.stopPropagation();
    }
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
window.addEventListener('unhandledrejection', function (ev) {
  $.alert({
    title: 'Unhandled Rejection Error',
    type: 'red',
    columnClass: 'xlarge',
    content: div({ class: 'unhandled-rejection-dlg' },
      div({ class: 'message' }, ev.reason.message),
      div({ class: 'stack' }, ev.reason.stack)
    )
  })
});
