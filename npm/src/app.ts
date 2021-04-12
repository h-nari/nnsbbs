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

let rs = new ReadSet('1-9');
console.log(rs.toJson());
rs.sub_range(5,6);
console.log(rs.toJson());
rs.sub_range(8,8);
console.log(rs.toJson());
