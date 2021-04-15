import NssBss from './nnsbbs';
import {ReadSet} from './readSet';

declare global {
  interface Window {
    nssbss: NssBss;
    nssbss_baseUrl: string;
  }
}

let nb = new NssBss();
window.nssbss = nb;

$(() => {
  $('#main').html(nb.html());
  nb.bind();
  nb.gm.setSize();
  // set_main_size();
});

$(window).on('resize', () => {
  nb.gm.setSize();
  // set_main_size();
});

