import NssBss from './nnsbbs';

declare global {
  interface Window {
    nssbss: NssBss;
    nssbss_baseUrl: string;
  }
}

window.nssbss = new NssBss();
