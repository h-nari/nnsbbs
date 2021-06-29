import { Menu } from "./menu";
import { INewsgroupAdmin, NewsgroupAdmin, newsgroup_pat } from "./newsgroupAdmin";
import { div, icon, input, li, selected, span, ul } from "./tag";
import { get_json, splitPath } from "./util";

export class NewsgroupAdminTree {
  public newsgroupAdmin: NewsgroupAdmin;
  public name: string;
  public path: string;
  public newsgroup: (INewsgroupAdmin | null) = null;
  public children: NewsgroupAdminTree[] = [];
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
    this.menu = new Menu({ icon: 'three-dots' });
  }

  map(func: (n: NewsgroupAdminTree) => void) {
    func(this);
    for (let c of this.children)
      c.map(func);
  }

  findNewsgroup(path: string): NewsgroupAdminTree | null {
    let s = splitPath(path);
    let parent: NewsgroupAdminTree | null;
    if (s.parent) {
      parent = this.findNewsgroup(s.parent);
      if (parent)
        return parent.findNewsgroup(s.base);
    } else {
      for (let c of this.children)
        if (c.name == path)
          return c;
    }
    return null;
  }

  allocNewsgroup(path: string, n: (INewsgroupAdmin | null) = null): NewsgroupAdminTree {
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

  allocChild(name: string): NewsgroupAdminTree {
    for (let c of this.children) {
      if (c.name == name)
        return c;
    }
    let path = this.path == '' ? name : this.path + '.' + name;
    let c = new NewsgroupAdminTree(this.newsgroupAdmin, name, path);
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
    let i18next = this.newsgroupAdmin.parent.i18next;
    this.menu.clear();
    this.menu.add(new Menu({
      name: i18next.t('create-subordinate-newsgroups'),
      action: e => {
        this.newsgroupAdmin.new_newsgroups_dlg(this);
      }
    }));
    if (this.bDeleted) {
      this.menu.add(new Menu({
        name: i18next.t('remove-delete-flag'),
        action: e => {
          this.undelete();
        }
      }));
      if (this.depth > 0) {
        this.menu.add(new Menu({
          name: i18next.t('remove-delete-flag-of-lower-levels'),
          action: e => {
            this.undelete('tree');
          }
        }));
      }
    } else {
      this.menu.add(new Menu({
        name: i18next.t('delete'),
        action: e => {
          this.delete_newsgroup_dlg();
        }
      }));
    }
    this.menu.add(new Menu({
      name: i18next.t('rename'),
      action: e => {
        this.rename_dlg();
      }
    }));
    if (this.children.length > 1)
      this.menu.add(new Menu({ name: i18next.t('reordering'), action: e => { this.reorderChildDlg(e) } }));
    if (this.depth > 0) {
      this.menu.add(new Menu({
        name: i18next.t('fold-all'),
        action: e => {
          this.map(n => { n.fold = true; });
          this.newsgroupAdmin.redisplay();
        }
      })).add(new Menu({
        name: i18next.t('unfold-all'),
        action: e => {
          this.map(n => { n.fold = false; });
          this.newsgroupAdmin.redisplay();
        }
      }));
    }
    if (this.depth > 1) {
      this.menu.add(new Menu({
        name: i18next.t('unfold-to-one-layer-down'),
        action: e => {
          this.map(n => { n.fold = true; });
          this.fold = false;
          this.newsgroupAdmin.redisplay();
        }
      }));
    }
    for (let c of this.children)
      c.makeMenu();
  }

  sub_html(selected_node: NewsgroupAdminTree | null = null): string {
    let s = '';
    for (let c of this.children) {
      if (this.newsgroupAdmin.bShowDeleted || !c.bDeleted)
        s += c.html(selected_node);
    }
    return s;
  }

  html(selected_node: NewsgroupAdminTree | null = null): string {
    let fold_icon = '';
    if (this.children.length > 0)
      fold_icon = span({ class: 'btn-fold ' + (this.fold ? 'bi-chevron-right' : 'bi-chevron-down') })

    let c = 'newsgroup-line d-flex';
    if (this === selected_node) c += ' selected';
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
    let i18next = this.newsgroupAdmin.parent.i18next;
    let ng = this.newsgroup;
    if (this.children.length > 0) {
      $.confirm({
        title: i18next.t('confirm'),
        content: i18next.t('cannot-delete-tree'),
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
        title: i18next.t('confirm'),
        content: i18next.t('cannot-delete-posted-group'),
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
        title: i18next.t('confirm'),
        content: i18next.t('delete-or-flag'),
        columnClass: 'medium',
        buttons: {
          'Real Delete': async () => {
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
    let i18next = this.newsgroupAdmin.parent.i18next;
    $.confirm({
      title: i18next.t('rename-newsgroup'),
      type: 'red',
      columnClass: 'large',
      content: div(input({ id: 'newsgroup-name', type: 'text', value: this.path })),
      buttons: {
        ok1: {
          text: i18next.t('only-this-newsgroup'),
          action: () => {
            let name = $('#newsgroup-name').val() as string;
            if (this.invalid_newname(name)) return false;
            this.rename(name, 'node');
          }
        },
        ok2: {
          text: i18next.t('change-also-lower-layer'),
          action: () => {
            let name = $('#newsgroup-name').val() as string;
            if (this.invalid_newname(name)) return false;
            this.rename(name, 'tree');
          }
        },
        cancel: {
          text: i18next.t('cancel')
        }
      }
    });
  }

  invalid_newname(newname: string): boolean {
    let i18next = this.newsgroupAdmin.parent.i18next;
    if (!newname) {
      $.alert(i18next.t('name-is-blank'));
      return true;
    } else if (newname == this.path) {
      $.alert(i18next.t('name-not-changed'));
      return true;
    } else if (!newname.match(newsgroup_pat)) {
      $.alert(i18next.t('name-format-is-incorrect'));
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

  reorderChildDlg(e: JQuery.ClickEvent) {
    let i18next = window.nnsbbs.i18next;
    $.confirm({
      title: i18next.t('reorder-newsgroups'),
      type: 'yellow',
      columnClass: 'medium',
      content: div({ class: 'reorder-child' },
        div({ class: 'explain' }, 'drag-newsgroup-to-reorder'),
        ul({ class: 'sortable' }, this.children.map(c =>
          li({ class: 'ui-state-default', path: c.path }, icon('grip-vertical'),
            span(c.path))).join(''))),
      onOpen: () => {
        ($('.sortable') as any).sortable();
        ($('.sortable') as any).disableSelection();
      },
      buttons: {
        ok: {
          text: i18next.t('set'),
          action: async () => {
            let children = $('.sortable').children();
            let list: string[] = [];
            for (let i = 0; i < children.length; i++)
              list.push($(children[i]).attr('path') || '');
            await this.newsgroupAdmin.setNewsgroupOrder(list);
            this.newsgroupAdmin.redisplay(true);
          }
        },
        cancel: {
          text: i18next.t('cancel'),
        }
      }
    });
  }

  hasChild(): boolean {
    return this.children.length > 0;
  }
}
