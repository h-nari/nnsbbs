import NnsBbs from "./nnsbbs";
import { tag, div, span, table, td, th, tr, button, label, selected, input, icon, select, option, li, ul } from "./tag";
import { get_json } from "./util";
import { Menu } from "./menu";
import { IMembership } from "./dbif";

const newsgroup_pat = /^[^.\s]+(\.[^.\s]+)*$/;

interface INewsgroupAdmin {
  id: number, name: string, max_id: number, rpl: number, wpl: number,
  bLocked: number, bDeleted: number, created_at: string, posted_at: string,
  locked_at: string | null, deleted_at: string | null, ord: number,
  comment: string
};

export class NewsgroupAdmin {
  private id = 'newsgroup-admin';
  private parent: NnsBbs;
  private newsgroups: INewsgroupAdmin[] = [];
  public root: NewsgroupTree = new NewsgroupTree(this, '', '');
  private curNode: NewsgroupTree | null = null;
  private savedData: string = '{}';
  public menu;
  public bShowDeleted: boolean = false;
  private membership: IMembership | null = null;

  constructor(parent: NnsBbs) {
    this.parent = parent;
    this.menu = new Menu(icon('three-dots'));
    this.menu.add(new Menu('階層を全て折り畳む', e => {
      this.root.map(n => { n.fold = true; });
      this.root.fold = false;
      this.redisplay();
    }));
    this.menu.add(new Menu('階層を全て展開する', e => {
      this.root.map(n => { n.fold = false; });
      this.redisplay();
    }));
    this.menu.add(new Menu('ニュースグループの新規作成', e => {
      this.new_newsgroups_dlg();
    }));
    this.menu.add(new Menu('トップレベル.ニュースグループの並び変更', e => {
      reorderChildDlg(e, this.root);
    }));
    this.menu.add(new Menu('マーク済の削除可能なニュースグループを削除', e => {
      $.confirm({
        title: '確認',
        content: '本当に削除しますか？',
        buttons: {
          Yes: async () => {
            let result = { cnt: 0, list: [] };
            let n = await this.deleteMarkedNewsgroup(this.root, result);
            this.redisplay(true);
            $.alert(`${result.cnt}個のニュースグループを削除しました` +
              result.list.map(s => div(s)).join('\n')
            );
          },
          No: () => { }
        }
      });
    }));
  }

  html(): string {
    return div({ id: this.id }, this.innerHtml());
  }

  innerHtml(): string {
    return div({ class: 'newsgroup-tree row' },
      div({ class: 'col-sm-4' }, div(
        div({ class: 'header d-flex' },
          form_check('show-deleted-newsgroup', '削除されたニュースグループも表示', this.bShowDeleted),
          span({ style: 'flex-grow:1' }),
          this.menu.html()),
        this.root.sub_html(this.curNode))),
      div({ class: 'col-sm-8' }, this.detailHtml()));
  }

  bind() {
    this.menu.bind();
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

    $(`#${this.id} .btn-save-newsgroup`).on('click', e => {
      this.save();
    });

    $('#show-deleted-newsgroup').on('change', e => {
      this.bShowDeleted = $(e.currentTarget).prop('checked') as boolean;
      this.redisplay();
    });

    //TODO: btn-permission : permissionの変更ダイアログ
    $(`#${this.id} .btn-permission`).on('click', e => {
      console.log('permission dialog');
      if (this.curNode)
        this.permission_dlg();
    });
  }

  async redisplay(bFromDB: boolean = false) {
    if (bFromDB) {
      this.newsgroups = await get_json('/admin/api/newsgroup') as INewsgroupAdmin[];
      this.membership = await get_json('/api/membership') as IMembership;
      let old_root = this.root;
      this.root = new NewsgroupTree(this, '', '');
      for (let n of this.newsgroups)
        this.root.allocNewsgroup(n.name, n);
      if (this.curNode)
        this.curNode = this.root.findNewsgroup(this.curNode.path);
      else
        this.curNode = null;
      this.root.map(node => {
        let old = old_root.findNewsgroup(node.path);
        if (old)
          node.fold = old.fold;
      });
      this.root.sort();
      this.root.scan();
      this.root.makeMenu();
    }
    $('#' + this.id).html(this.innerHtml());
    this.bind();
  }

  detailHtml(): string {
    if (this.curNode) {
      let c = this.curNode;
      return div({ class: 'newsgroup-detail' },
        tag('form',
          form_row('Newsgroup', 3, span({ class: 'path' }, c.path)),
          form_row('', 3,
            form_check('ng-bLocked', '投稿不可', c.newsgroup ? c.newsgroup.bLocked != 0 : true)),
          form_row('Access Control', 3, button({ class: 'form-row btn-permission', type: 'button' },
            this.permission_html('Read:', 'rpl'), this.permission_html('Write:', 'wpl'))),
          div({ class: 'form-group' },
            label({ class: 'form-label' }, 'Newsgroups Description'),
            tag('textarea', { class: 'form-control', id: 'ng-comment', rows: 10 }, c.newsgroup ? c.newsgroup.comment : '')),
          button({ type: 'button', class: 'btn btn-primary btn-save-newsgroup' }, 'save')
        )
      );
    } else {
      return div({ class: 'newsgroup-detail center' },
        div({ class: 'alert alert-primary mx-auto d-inline-block' }, 'no newsgroup selected'))
    }
  }

  permission_html(title: string, field: string): string {
    let val = '';
    if (this.curNode && this.curNode.newsgroup)
      val = String(this.curNode.newsgroup[field]);
    return span({ class: 'permission' }, span(title), span('&ge;'),
      span(this.membership ? this.membership[val].name : ''))
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
      data = { update: JSON.stringify([nd]) };
    } else {
      let name = $('#ng-name').val() as string;
      nd['name'] = name;
      data = { insert: JSON.stringify([nd]) };
    }

    await get_json('/admin/api/newsgroup', { method: 'post', data });
    this.savedData = savedJson;
    this.redisplay(true);
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

  new_newsgroups_dlg(parent: NewsgroupTree | null = null) {
    let upper_node = '';
    if (parent) {
      upper_node = div({ class: 'parent' }, span('親ニュースグループ:'),
        span(parent.path)
      );
    }
    $.confirm({
      title: 'ニュースグループの新規作成',
      class: 'green',
      columnClass: 'large',
      content: div({ class: 'new-newsgroup-dlg' },
        upper_node,
        tag('textarea', {
          id: 'new-newsgroups', rows: 15,
          placeholder: '作成するニュースグループの名前を入力して下さい。\n複数可'
        })
      ),
      buttons: {
        ok: async () => {
          let lines = $('#new-newsgroups').val() as string;
          let bad_names: string[] = [];
          let names: any[] = [];
          for (let line0 of lines.split('\n')) {
            let line = line0.trim();
            if (line == '') continue;
            if (line.match(newsgroup_pat))
              names.push({ name: parent ? parent.path + '.' + line : line });
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
          await get_json('/admin/api/newsgroup', { method: 'post', data: { insert: JSON.stringify(names) } });
          await this.redisplay(true);
          await this.setNewsgroupOrder();
        },
        cancel: () => { }
      }
    });
  }

  // after fixing the order of the nodes specified in the list
  // fix the order of the whole tree and write it to the DB
  async setNewsgroupOrder(list: string[] = []) {
    for (let i = 0; i < list.length; i++) {
      let node = this.root.allocNewsgroup(list[i]);
      node.ord0 = i;
    }
    this.root.sort();
    this.root.scan(100);

    let new_list: any[] = [];
    let update_list: any[] = [];

    this.root.map(node => {
      let n = node.newsgroup;
      if (n)
        update_list.push({ id: n.id, ord: node.ord });
      else if (node.name != "")    // skip root node
        new_list.push({ name: node.path, bLocked: 1, ord: node.ord });
    });
    if (new_list.length > 0)
      await get_json('/admin/api/newsgroup', { method: 'post', data: { insert: JSON.stringify(new_list) } });
    if (update_list.length > 0)
      await get_json('/admin/api/newsgroup', { method: 'post', data: { update: JSON.stringify(update_list) } });
  }

  async deleteMarkedNewsgroup(node: NewsgroupTree, result: { cnt: number, list: string[] }): Promise<boolean> {
    let children: NewsgroupTree[] = [];
    for (let c of node.children) {
      let deleted = await this.deleteMarkedNewsgroup(c, result);
      if (!deleted) children.push(c);
    }
    if (!node.bDeleted || children.length > 0 && node.newsgroup && node.newsgroup.max_id > 0) {
      console.log(node.path, ' is keep');
      node.children = children;
      return false;
    } else {
      console.log(node.path, ' is deleted');
      if (node.newsgroup) {
        await get_json('/admin/api/newsgroup', { method: 'post', data: { delete: JSON.stringify([{ id: node.newsgroup.id }]) } });
      }
      result.cnt++;
      result.list.push(node.path);
      return true;
    }
  }

  permission_dlg() {
    let node = this.curNode;
    if (!node || !node.newsgroup) return;
    let rpl = node.newsgroup.rpl;
    let wpl = node.newsgroup.wpl;

    $.confirm({
      title: 'newsgroup permission setting',
      type: 'green',
      columnClass: 'large',
      content: div({ class: 'permission-dlg' },
        this.permission_select('Read:', 'rpl', rpl),
        this.permission_select('Write:', 'wpl', wpl)),
      buttons: {
        ok1: {
          text: 'このニュースグループのみ変更',
          action: () => {
            let rpl = $('.permission-dlg .rpl').val() as string;
            let wpl = $('.permission-dlg .wpl').val() as string;
            this.set_permission('node', rpl, wpl);
          }
        },
        ok2: {
          text: '下位のニュースグループも変更',
          action: () => {
            let rpl = $('.permission-dlg .rpl').val() as string;
            let wpl = $('.permission-dlg .wpl').val() as string;
            this.set_permission('tree', rpl, wpl);
          }
        },
        cancel: {
          text: 'キャンセル'
        }
      }
    });
  }

  permission_select(label_str: string, class_str: string, val: number): string {
    let opt = '';
    for (let i in this.membership) {
      let m = this.membership[i];
      opt += option({ value: i, selected: selected(i == String(val)) },
        span('&ge;'), span(m.name));
    }
    return div({ class: 'permission-select' }, label(label_str), select({ class: class_str }, opt));
  }

  async set_permission(type: 'node' | 'tree', rpl: string, wpl: string) {
    let cur = this.curNode;
    if (!cur) return;
    let insert_list: Object[] = [];
    let update_list: Object[] = [];

    if (type == 'node') {
      let n = cur.newsgroup;
      if (n) update_list.push({ id: n.id, rpl, wpl });
      else insert_list.push({ name: cur.path, rpl, wpl, bLocked: 1 });
    } else {
      cur.map(node => {
        let n = node.newsgroup;
        if (n) update_list.push({ id: n.id, rpl, wpl });
        else insert_list.push({ name: node.path, rpl, wpl, bLocked: 1 });
      });
    }
    if (insert_list.length > 0)
      await get_json('/admin/api/newsgroup', { method: 'post', data: { insert: JSON.stringify(insert_list) } });
    if (update_list.length > 0)
      await get_json('/admin/api/newsgroup', { method: 'post', data: { update: JSON.stringify(update_list) } });
    this.redisplay(true);
  }

}


//============================================================================================================
//================================= End of class NewsgroupAdmin ==============================================
//============================================================================================================


function form_row(label_str: string, ratio: number, content: string) {
  let ratio1 = 'col-sm-' + ratio;
  let ratio2 = 'col-sm-' + (12 - ratio);

  return div({ class: 'form-group row' },
    label({ class: ratio1 + ' col-form-label' }, label_str),
    div({ class: ratio2 }, content));
}

function form_check(id: string, label_str: string, value: boolean) {
  return div({ class: 'form-check-inline' },
    input({ class: 'form-control-input', type: 'checkbox', id, checked: selected(value) }),
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
  public fold: boolean = true;
  public menu: Menu;
  public bDeleted: number = 0;

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

  findNewsgroup(path: string): NewsgroupTree | null {
    let s = splitPath(path);
    let parent: NewsgroupTree | null;
    if (s.parent) {
      parent = this.findNewsgroup(s.parent);
    } else parent = this;

    if (parent) {
      for (let c of parent.children)
        if (c.path == path)
          return c;
    }
    return null;
  }

  allocNewsgroup(path: string, n: (INewsgroupAdmin | null) = null): NewsgroupTree {
    let i = path.indexOf('.');
    if (i < 0) {
      let child = this.allocChild(path);
      if (n) {
        child.newsgroup = n;
        child.ord0 = n.ord;
        child.bDeleted = n.bDeleted;
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
  scan(ord: number = 0): { depth: number, ord: number } {
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
    this.menu.add(new Menu('下位ニュースグループを作成', e => {
      this.newsgroupAdmin.new_newsgroups_dlg(this);
    }));
    if (this.bDeleted) {
      this.menu.add(new Menu('削除取消', e => {
        console.log('call undelete');
        this.undelete();
      }));
      if (this.depth > 0) {
        this.menu.add(new Menu('下位階層も削除取消', e => {
          console.log('call undelete');
          this.undelete('tree');
        }));
      }
    } else {
      this.menu.add(new Menu('削除', e => {
        this.delete_newsgroup_dlg();
      }));
    }
    this.menu.add(new Menu('名称変更', e => {
      this.rename_dlg();
    }));
    if (this.children.length > 1)
      this.menu.add(new Menu('順番変更', reorderChildDlg, this));
    if (this.depth > 0) {
      this.menu.add(new Menu('全て折り畳む', e => {
        this.map(n => { n.fold = true; });
        this.newsgroupAdmin.redisplay();
      }));
      this.menu.add(new Menu('全て展開', e => {
        this.map(n => { n.fold = false; });
        this.newsgroupAdmin.redisplay();
      }));
    }
    if (this.depth > 1) {
      this.menu.add(new Menu('1層下まで展開', e => {
        this.map(n => { n.fold = true; });
        this.fold = false;
        this.newsgroupAdmin.redisplay();
      }));
    }
    for (let c of this.children)
      c.makeMenu();
  }

  sub_html(selected_node: NewsgroupTree | null = null): string {
    let s = '';
    for (let c of this.children) {
      if (this.newsgroupAdmin.bShowDeleted || !c.bDeleted)
        s += c.html(selected_node);
    }
    return s;
  }

  html(selected_node: NewsgroupTree | null = null): string {
    let fold_icon = '';
    if (this.children.length > 0)
      fold_icon = span({ class: 'btn-fold ' + (this.fold ? 'bi-chevron-right' : 'bi-chevron-down') })

    let c = 'newsgroup-line d-flex';
    if (this == selected_node) c += ' selected';
    if (this.bDeleted) c += ' deleted';
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

  delete_newsgroup_dlg() {
    let ng = this.newsgroup;
    if (this.children.length > 0) {
      $.confirm({
        title: '確認',
        content: div('下位階層ニュースグループがあるので削除できません。',
          '下位階層含めて 削除フラグをつけますか？'),
        buttons: {
          Yes: () => {
            this.map(n => { n.bDeleted = 1; });
            this.update_deleted('tree');
            this.newsgroupAdmin.redisplay(true);
          },
          Cancel: () => { }
        }
      })
      return;
    }
    else if (ng && ng.max_id > 0) {
      $.confirm({
        title: '確認',
        content: div('記事が投稿済なので削除できません。',
          '削除フラグをつけますか？'),
        buttons: {
          Yes: () => {
            this.bDeleted = 1;
            this.update_deleted('node');
            this.newsgroupAdmin.redisplay(true);
          },
          Cancel: () => { }
        }
      })
    }
    else {
      $.confirm({
        title: '確認',
        content: div('本当に削除しますか？',
          'それとも削除フラグだけにしますか？'),
        columnClass: 'medium',
        buttons: {
          'Real Delete': async () => {
            console.log('Real Delete');
            let n = this.newsgroup;
            if (n) {
              await get_json('/admin/api/newsgroup', {
                method: 'post',
                data: { delete: JSON.stringify([{ id: n.id }]) }
              });
            }
            this.newsgroupAdmin.redisplay(true);
          },
          'Flag Only': () => {
            this.bDeleted = 1;
            this.update_deleted('node');
            this.newsgroupAdmin.redisplay();
          },
          Cancel: () => { }
        }
      })
    }
  };

  update_deleted(type: 'node' | 'tree') {
    let insert_list: object[] = [];
    let update_list: object[] = [];

    if (type == 'node') {
      let n = this.newsgroup;
      if (n)
        update_list.push({ id: n.id, bDeleted: this.bDeleted });
      else
        insert_list.push({ name: this.path, bDeleted: this.bDeleted, bLocked: 1 });
    } else {
      this.map(node => {
        let n = node.newsgroup;
        if (n)
          update_list.push({ id: n.id, bDeleted: node.bDeleted });
        else
          insert_list.push({ name: node.path, bDeleted: node.bDeleted, bLocked: 1 });
      });
    }
    if (insert_list.length > 0)
      get_json('/admin/api/newsgroup', { method: 'post', data: { insert: JSON.stringify(insert_list) } });
    if (update_list.length > 0)
      get_json('/admin/api/newsgroup', { method: 'post', data: { update: JSON.stringify(update_list) } });
  }

  undelete(type: 'tree' | 'node' = 'node') {
    let list: object[] = [];
    if (type == 'node') {
      this.bDeleted = 0;
      let n = this.newsgroup;
      if (n) list.push({ id: n.id, bDeleted: 0 });
    } else {
      this.map(node => {
        node.bDeleted = 0;
        let n = node.newsgroup;
        if (n) list.push({ id: n.id, bDeleted: 0 });
      });
    }
    get_json('/admin/api/newsgroup', { method: 'post', data: { update: JSON.stringify(list) } });
    this.newsgroupAdmin.redisplay(true);
  }

  rename_dlg() {
    $.confirm({
      title: 'ニュースグループの名称変更',
      type: 'red',
      columnClass: 'large',
      content: div(input({ id: 'newsgroup-name', type: 'text', value: this.path })),
      buttons: {
        ok1: {
          text: 'このニュースグループだけ変更',
          action: () => {
            let name = $('#newsgroup-name').val() as string;
            if (this.invalid_newname(name)) return false;
            this.rename(name, 'node');
          }
        },
        ok2: {
          text: '下位のニュースグループも変更',
          action: () => {
            let name = $('#newsgroup-name').val() as string;
            if (this.invalid_newname(name)) return false;
            this.rename(name, 'tree');
          }
        },
        cancel: {
          text: 'キャンセル'
        }
      }
    });
  }

  invalid_newname(newname: string): boolean {
    if (!newname) {
      $.alert('名前が空です');
      return true;
    } else if (newname == this.path) {
      $.alert('名前が変更されていません');
      return true;
    } else if (!newname.match(newsgroup_pat)) {
      $.alert('名前の形式が正しくありません');
      return true;
    }
    return false;
  }

  async rename(newname: string, type: 'node' | 'tree') {
    let insert_list: object[] = [];
    let update_list: object[] = [];

    if (type == 'node') {
      let n = this.newsgroup;
      if (n)
        update_list.push({ id: n.id, name: newname });
      else
        insert_list.push({ name: newname, bLocked: 1 });
    } else { // tree
      this.path = newname;
      this.map(node => {
        for (let c of this.children) {
          c.path = this.path + '.' + c.name;
        }
        let n = node.newsgroup;
        if (n)
          update_list.push({ id: n.id, name: node.path });
        else
          insert_list.push({ name: node.path, bLocked: 1 });
      });
    }
    if (insert_list.length > 0)
      await get_json('/admin/api/newsgroup', { method: 'post', data: { insert: JSON.stringify(insert_list) } });
    if (update_list.length > 0)
      await get_json('/admin/api/newsgroup', { method: 'post', data: { update: JSON.stringify(update_list) } });
    this.newsgroupAdmin.redisplay(true);
  }
}

// --------------------- End of NewsgroupTree Class ------------------------

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
          node.newsgroupAdmin.redisplay(true);
        }
      },
      cancel: {
        text: 'キャンセル',
      }
    }
  });

}

function splitPath(path: string): { parent: string | null, base: string } {
  let i = path.indexOf('.');
  if (i < 0) return { parent: null, base: path };
  else return { parent: path.substring(0, i), base: path.substring(i + 1) };
}
