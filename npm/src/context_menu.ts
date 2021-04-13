import { div, button } from "./tag";

type MenuAction = (e: JQuery.Event) => void;

interface IContextMenuOption {
  title?: string;
  width?: number;
  buttons: {
    [name: string]: IMenu | MenuAction;
  }
};

interface IMenu {
  text?: string;
  action: MenuAction;
};

var sn = 0;
const id = 'nnsbbs-context-menu';

export function contextMenu(e: JQuery.ContextMenuEvent, opt: IContextMenuOption) {
  let oe = e.originalEvent;
  let x = oe?.screenX;
  let y = oe?.screenY
  let cx = oe?.clientX;
  let cy = oe?.clientY;
  let id2action = {};
  let c = "";
  for (let name in opt.buttons) {
    let val = opt.buttons[name];
    let btn_id = 'cm-btn-' + sn++;
    if (typeof val == 'function') {
      c += div({ id: btn_id, type: 'button' }, name);
      id2action[btn_id] = val;
    } else if (typeof val == 'object') {
      c += div({ id: btn_id, type: 'button' }, val.text || name)
      id2action[btn_id] = val.action;
    }
  }

  c = div({ class: 'nb-list-group' }, c);
  if (opt.title)
    c = div({ class: 'menu-title' }, opt.title) + c;
  let style = `position:absolute; top: ${cy}px; left:${cx}px;`;
  if (opt.width)
    style += ` width: ${opt.width}px;`;
  c = div({ id, style: 'z-index:10;', class: 'no-contextmenu' },
    div({ class: 'context-menu', style }, c));

  console.log('my contextMenu');

  $('#' + id).remove();
  $('body').prepend(c);
  e.preventDefault();

  $('#' + id).on('click', function (e) {
    $(this).remove();
    e.preventDefault();
  })

  for (let id in id2action) {
    $('#' + id).on('click', id2action[id]);
    $('#' + id).on('contextmenu', e => {
      console.log('right clicked');
      id2action[id](e);
    });
  }
};

export function closeContextMenu() {
  $('#' + id).remove();
}