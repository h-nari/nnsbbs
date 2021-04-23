import NnsBbs from './nnsbbs';
import i18next from 'i18next';
import { jp } from './locale/jp';
import { en } from './locale/en';

declare global {
  interface Window {
    nnsbbs: NnsBbs;
    nnsbbs_baseUrl: string;
  }
}

let nb = new NnsBbs(i18next);
window.nnsbbs = nb;
i18next.init({
  lng: 'en',
  debug: true,
  resources: { en, jp }
});

$(() => {
  $('#main').html(nb.html());
  nb.bind();
  nb.gm.setSize();
});

$(window).on('resize', () => {
  nb.gm.setSize();
});

$(window).on('popstate', e => {
  console.log('popstate:', document.location.pathname);
  let d = document.location.pathname.split('/');
  if (d.length == 1)
    nb.top_page();
  else if (d.length == 2)
    nb.top_page(d[1]);
  else if (d.length == 3)
    nb.top_page(d[1], d[2])
})

$(window).on('keydown', function (e) {
  if (e.key == 'j') nb.setLanguage('jp');
  else if (e.key == 'e') nb.setLanguage('en');
  else if (e.key == "Enter") {
    nb.setLanguage(i18next.language == 'en' ? 'jp' : 'en');
  }
});
