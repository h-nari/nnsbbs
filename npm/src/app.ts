import NssBss from './nnsbbs';

declare global {
  interface Window {
    nssbss: NssBss;
    nssbss_baseUrl: string;
  }
}

let nb = new NssBss();
window.nssbss = nb;

function set_main_size() {
  let h = $(window).height();
  if (h) {
    h -= 100;
    console.log('h:',h);
    $("#main").css("height", h + "px");
  }
}

$(() => {
  $('#main').html(nb.html());
  set_main_size();
  nb.bind();
});

$(window).on('resize', () => {
  set_main_size();
});
