import NnsBbs from './nnsbbs';

declare global {
  interface Window {
    nnsbbs: NnsBbs;
    nnsbbs_baseUrl: string;
  }
}

let nb = new NnsBbs();
window.nnsbbs = nb;
console.log('nnsbbs');

$(() => {
  $('#main').html(nb.html());
  nb.bind();
  nb.gm.setSize();
});

$(window).on('resize', () => {
  nb.gm.setSize();
});
