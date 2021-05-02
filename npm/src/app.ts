import NnsBbs from './nnsbbs';
import i18next from 'i18next';
import { jp } from './locale/jp';
import { en } from './locale/en';

declare global {
  interface Window {
    nnsbbs: NnsBbs;
    nnsbbs_baseURL: string;
  }
}

let nb = new NnsBbs(i18next);
window.nnsbbs = nb;
i18next.init({
  lng: 'jp',
  debug: true,
  resources: { en, jp }
});
