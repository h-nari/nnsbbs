import NnsBbs from "./nnsbbs";
import { tag, div, span, table, td, th, tr, button, label, selected, input, icon, option, li, ul } from "./tag";
import { get_json } from "./util";
import { Menu } from "./menu";

interface INewsgroupAdmin {
  id: number, name: string, max_id: number, access_group: number,
  bLocked: number, bDeleted: number, created_at: string, posted_at: string,
  locked_at: string | null, deleted_at: string | null, ord0: number, ord: number,
  comment: string
};

export class NewsgroupAdmin {
  private id = 'newsgroup-admin';
  private parent: NnsBbs;
  private newsgroups: INewsgroupAdmin[] = [];
  public root: NewsgroupTree = new NewsgroupTree(this, '', '');
  private curNode: NewsgroupTree | null = null;
  private savedData: string = '{}';

  constructor(parent: NnsBbs) {
    this.parent = parent;
  }

  html(): string {
    return div({ id: this.id }, this.innerHtml());
  }

  innerHtml(): string {
    return div({ class: 'newsgroup-tree row' },
      div({ class: 'col-sm-4' }, div(
        div({ class: 'header d-flex' },
          span({ style: 'flex-grow:1' }),
          form_check('show-deleted-newsgroup', '削除されたニュースグループも表示', 1),
          button({ type: 'button', class: 'btn btn-new-newsgroup', title: '新規ニュースグループ' },
            span({ class: 'bi-plus-square' }))),
        this.root.sub_html(this.curNode))),
      div({ class: 'col-sm-8' }, this.detailHtml()));
  }

  bind() {
    this.root.bind();
    $(window).on('beforeunload', e => {
      let sd = JSON.stringify(this.newsgroup_data());
      if (sd != this.savedData) {
        e.preventDefault();
        return '未保存の変更があります';
      }
      $(window).off('beforeunload');
    });

    $(`#${this.id} .btn-fold`).on('click', e => {
      let t = e.currentTarget;
      if (t.parentElement) {
        let path = t.parentElement.attributes['path'].value as string;
        let node = this.root.allocNewsgroup(path);
        node.fold = !node.fold;
        this.redisplay();
      }
    });
    $(`#${this.id} .newsgroup-line`).on('click', async (e) => {
      if (await this.saveNeeded())
        await this.save();
      let path = $(e.currentTarget).attr('path') || '';
      this.curNode = this.root.allocNewsgroup(path);
      this.redisplay();
      this.savedData = JSON.stringify(this.newsgroup_data());
    });

    $(`#${this.id} .btn-new-newsgroup`).on('click', e => {
      this.new_newsgroups_dlg();
    });

    $(`#${this.id} .btn-save-newsgroup`).on('click', e => {
      this.save();
    });
  }

  redisplay() {
    $('#' + this.id).html(this.innerHtml());
    this.bind();
  }

  async init() {
    this.newsgroups = await get_json('/admin/api/newsgroup') as INewsgroupAdmin[];
    for (let n of this.newsgroups)
      this.root.allocNewsgroup(n.name, n);
    this.root.sort();
    this.root.makeMenu();
    this.redisplay();
  }

  detailHtml(): string {
    if (this.curNode) {
      let c = this.curNode;
      return div({ class: 'newsgroup-detail' }, tag('h3', c.path),
        tag('form',
          form_row('パス', 3, input({ id: 'ng-name', class: 'form-control', value: c.path, readonly: null })),
          form_row('', 3,
            form_check('ng-bLocked', '投稿不可', c.newsgroup ? c.newsgroup.bLocked : 1)),
          div({ class: 'form-group' },
            label({ class: 'form-label' }, 'ニュースグループの説明'),
            tag('textarea', { class: 'form-control', id: 'ng-comment', rows: 10 }, c.newsgroup ? c.newsgroup.comment : '')),
          button({ type: 'button', class: 'btn btn-primary btn-save-newsgroup' }, '保存')
        )
      );
    } else {
      return div('ニュースグループが選択されていません')
    }
  }

  newsgroup_data(): object {
    let bLocked = $('#ng-bLocked').prop('checked');
    let comment = $('#ng-comment').val();
    return { bLocked, comment };
  }

  async save() {
    let tree_node = this.curNode;
    if (!tree_node) return;

    let nd = this.newsgroup_data();
    let savedJson = JSON.stringify(nd);

    let data: any;
    if (tree_node.newsgroup) {
      nd['id'] = tree_node.newsgroup.id;
      data = { write: JSON.stringify([nd]) };
    } else {
      let name = $('#ng-name').val() as string;
      nd['name'] = name;
      data = { new: JSON.stringify([nd]) };
    }

    await get_json('/admin/api/newsgroup', { method: 'post', data });
    this.savedData = savedJson;
    this.init();
  }

  saveNeeded() {
    return new Promise((resolve, reject) => {
      let sd = JSON.stringify(this.newsgroup_data());
      if (sd == this.savedData) {
        resolve(false);
        return;
      }
      $.confirm({
        title: '保存確認',
        content: '変更を保存しますか？',
        buttons: {
          'Save': () => {
            resolve(true);
          },
          'Cancel': () => {
            resolve(false);
          }
        }
      });
    });

  }

  new_newsgroups_dlg() {
    $.confirm({
      title: 'ニュースグループの新規作成',
      class: 'green',
      columnClass: 'large',
      content: div({ class: 'new-newsgroup-dlg' },
        tag('textarea', {
          id: 'new-newsgroups', rows: 15,
          placeholder: '作成するニュースグループの名前を入力して下さい。\n複数可'
        })
      ),
      buttons: {
        ok: () => {
          let lines = $('#new-newsgroups').val() as string;
          let bad_names: string[] = [];
          let names: any[] = [];
          for (let line0 of lines.split('\n')) {
            let line = line0.trim();
            if (line == '') continue;
            if (line.match(/^[^.\s]+(\.[^.\s]+)*$/))
              names.push({ name: line });
            else
              bad_names.push(line);
          }
          if (bad_names.length > 0) {
            $.alert({
              content: div('以下の名前はニュースグループ名として不適当です。',
                div(bad_names.join(','))
              )
            });
            return false;
          }
          get_json('/admin/api/newsgroup', { method: 'post', data: { new: JSON.stringify(names) } })
            .then(d => { this.init(); })
            .catch(e => {
              console.log(e);
              $.alert(e);
            });
        },
        cancel: () => { }
      }
    });
  }

  async setNewsgroupOrder(list: string[]) {
    for (let i = 0; i < list.length; i++) {
      let node = this.root.allocNewsgroup(list[i]);
      node.ord0 = i;
    }
    this.root.sort();
    this.root.scan(100);
    console.log('----------------------------');
    this.root.map(node => {
      console.log(node.path, '.ord=>', node.ord);
    })

    let new_list: any[] = [];
    let update_list: any[] = [];

    this.root.map(node => {
      let n = node.newsgroup;
      if (n)
        update_list.push({ id: n.id, ord0: node.ord0, ord: node.ord });
      else if (node.name != "")    // skip root node
        new_list.push({ name: node.path, bLocked: 1, ord0: node.ord0, ord: node.ord });
    });
    if (new_list.length > 0)
      await get_json('/admin/api/newsgroup', { method: 'post', data: { new: JSON.stringify(new_list) } });
    if (update_list.length > 0)
      await get_json('/admin/api/newsgroup', { method: 'post', data: { write: JSON.stringify(update_list) } });
  }
}
//---------------------- End of class NewsgroupAdmin -----------------------  

function form_row(label_str: string, ratio: number, content: string) {
  let ratio1 = 'col-sm-' + ratio;
  let ratio2 = 'col-sm-' + (12 - ratio);

  return div({ class: 'form-group row' },
    label({ class: ratio1 + ' col-form-label' }, label_str),
    div({ class: ratio2 }, content));
}

function form_check(id: string, label_str: string, value: number) {
  return div({ class: 'form-check-inline' },
    input({ class: 'form-control-input', type: 'checkbox', id, checked: selected(value != 0) }),
    label({ class: 'form-check-label', for: id }, label_str)
  );
}

class NewsgroupTree {
  public newsgroupAdmin: NewsgroupAdmin;
  public name: string;
  public path: string;
  public newsgroup: (INewsgroupAdmin | null) = null;
  public children: NewsgroupTree[] = [];
  public ord0: number = 0;
  public ord: number = 0;
  public depth: number = 0;
  public fold: boolean = false;
  public menu: Menu;

  constructor(admin: NewsgroupAdmin, name: string, path: string) {
    this.newsgroupAdmin = admin;
    this.name = name;
    this.path = path;
    this.menu = new Menu(icon('three-dots'));
  }

  map(func: (n: NewsgroupTree) => void) {
    func(this);
    for (let c of this.children)
      c.map(func);
  }

  allocNewsgroup(path: string, n: (INewsgroupAdmin | null) = null): NewsgroupTree {
    let i = path.indexOf('.');
    if (i < 0) {
      let child = this.allocChild(path);
      if (n) {
        child.newsgroup = n;
        child.ord0 = n.ord0;
      }
      return child;
    } else {
      let layer = path.substring(0, i);
      let left = path.substring(i + 1);
      let child = this.allocChild(layer)
      return child.allocNewsgroup(left, n);
    }
  }

  allocChild(name: string): NewsgroupTree {
    for (let c of this.children) {
      if (c.name == name)
        return c;
    }
    let path = this.path == '' ? name : this.path + '.' + name;
    let c = new NewsgroupTree(this.newsgroupAdmin, name, path);
    this.children.push(c);
    return c;
  }

  sort() {
    for (let c of this.children)
      c.sort();
    this.children.sort((a, b) => {
      if (a.ord0 < b.ord0) return -1;
      if (a.ord0 > b.ord0) return 1;
      return a.name.localeCompare(b.name);
    })
  }

  // update ord and depth
  // return [depth,ord]
  scan(ord: number): { depth: number, ord: number } {
    console.log(this.path, '.ord=', ord);
    this.ord = ord++;
    let depth = 0;
    for (let c of this.children) {
      let r = c.scan(ord);
      ord = r.ord;
      depth = Math.max(depth, r.depth + 1);
    }
    this.depth = depth;
    return { depth, ord };
  }

  makeMenu() {
    this.menu.clear();
    this.menu.add(new Menu('ニュースグループの削除'));
    this.menu.add(new Menu('ニュースグループの名称変更'));
    if (this.children.length > 1)
      this.menu.add(new Menu('子要素の順番変更', reorderChildDlg, this));
    for (let c of this.children)
      c.makeMenu();
  }

  sub_html(selected_node: NewsgroupTree | null = null): string {
    let s = '';
    for (let c of this.children)
      s += c.html(selected_node);
    return s;
  }

  html(selected_node: NewsgroupTree | null = null): string {
    let fold_icon = '';
    if (this.children.length > 0)
      fold_icon = span({ class: 'btn-fold ' + (this.fold ? 'bi-chevron-right' : 'bi-chevron-down') })

    let c = 'newsgroup-line d-flex';
    if (this == selected_node) c += ' selected';
    return div({ class: 'sub-tree', fold: selected(this.fold) },
      div({ path: this.path, class: c },
        span({ class: 'name' }, this.name),
        fold_icon,
        span({ style: 'flex-grow:1' }),
        this.menu.html()),
      this.fold ? '' : div(this.sub_html(selected_node))
    );
  }

  bind() {
    this.menu.bind();
    for (let c of this.children)
      c.bind();
  }

};

function reorderChildDlg(e: JQuery.ClickEvent, arg: any) {
  let node = arg as NewsgroupTree;

  $.confirm({
    title: 'ニュースグループの並び変更',
    type: 'yellow',
    columnClass: 'medium',
    content: div({ class: 'reorder-child' },
      div({ class: 'explain' }, 'ニュースグループ名をドラッグし順番を変更して下さい'),
      ul({ class: 'sortable' }, node.children.map(c =>
        li({ class: 'ui-state-default', path: c.path }, icon('grip-vertical'),
          span(c.path))).join(''))),
    onOpen: () => {
      console.log('make sortable');
      ($('.sortable') as any).sortable();
      ($('.sortable') as any).disableSelection();
    },
    buttons: {
      ok: {
        text: '設定',
        action: async () => {
          let children = $('.sortable').children();
          let list: string[] = [];
          for (let i = 0; i < children.length; i++)
            list.push($(children[i]).attr('path') || '');
          await node.newsgroupAdmin.setNewsgroupOrder(list);
          node.newsgroupAdmin.init();
        }
      },
      cancel: {
        text: 'キャンセル',
      }
    }
  });
}

// TODO: 最上位ニュースグループの順序変更
// TODO: 以下の階層を折りたたむ
// TODO: 以下の階層を展開
// TODO: 1層下まで展開

