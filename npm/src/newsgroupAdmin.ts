import NnsBbs from "./nnsbbs";
import { tag, div, span, button, label, selected, input, select, option, li, ul } from "./tag";
import { get_json } from "./util";
import { Menu } from "./menu";
import { admin_api_db_check, admin_api_db_repair } from "./dbif";
import { NewsgroupAdminTree } from "./newsgroupAdminTree";
import { timers } from "jquery";

export const newsgroup_pat = /^[^.\s]+(\.[^.\s]+)*$/;

export interface INewsgroupAdmin {
  id: number, name: string, max_id: number, rpl: number, wpl: number,
  bLocked: number, bDeleted: number, created_at: string, posted_at: string,
  locked_at: string | null, deleted_at: string | null, ord: number,
  comment: string
};

export class NewsgroupAdmin {
  private id = 'newsgroup-admin';
  public parent: NnsBbs;
  private newsgroups: INewsgroupAdmin[] = [];
  public root = new NewsgroupAdminTree(this, '', '');
  private curNode: NewsgroupAdminTree | null = null;
  private savedData: string = '{}';
  public menu: Menu;
  public bShowDeleted: boolean = false;

  constructor(parent: NnsBbs) {
    this.parent = parent;
    this.menu = new Menu({ icon: 'three-dots' });
  }

  html(): string {
    return div({ id: this.id }, this.innerHtml());
  }

  innerHtml(): string {
    const i18next = this.parent.i18next;
    return div({ class: 'newsgroup-tree row' },
      div({ class: 'col-sm-4' }, div(
        div({ class: 'header d-flex' },
          form_check('show-deleted-newsgroup', i18next.t('also-show-deleted-newsgroups'), this.bShowDeleted),
          span({ style: 'flex-grow:1' }),
          this.menu?.html()),
        this.root.sub_html(this.curNode))),
      div({ class: 'col-sm-8' }, this.detailHtml()));
  }

  bind() {
    let i18next = this.parent.i18next;
    this.menu.clear();
    this.menu.add(new Menu({
      name: i18next.t('collapse-all-hierarchies'),
      action: e => {
        this.root.map(n => { n.fold = true; });
        this.root.fold = false;
        this.redisplay();
      }
    })).add(new Menu({
      name: i18next.t('expand-all-hierarchies'),
      action: e => {
        this.root.map(n => { n.fold = false; });
        this.redisplay();
      }
    })).add(new Menu({
      name: i18next.t('create-a-new-newsgroup'),
      action: e => {
        this.new_newsgroups_dlg();
      }
    })).add(new Menu({
      name: i18next.t('change-the-order-of-the-top-level-newsgroups'),
      action: e => {
        this.root.reorderChildDlg(e);
      }
    })).add(new Menu({
      name: i18next.t('delete-marked-newsgroups-that-can-be-deleted'),
      action: e => {
        $.confirm({
          title: i18next.t('confirm'),
          content: i18next.t('are-you-sure-you-want-to-delete-it?'),
          buttons: {
            Yes: async () => {
              let result = { cnt: 0, list: [] };
              let n = await this.deleteMarkedNewsgroup(this.root, result);
              this.redisplay(true);
              $.alert(i18next.t('deleted-n-newsgroups', { n: result.cnt }) +
                result.list.map(s => div(s)).join('\n')
              );
            },
            No: () => { }
          }
        });
      }
    }));
    this.menu.bind();
    this.root.bind();
    $(window).on('beforeunload', e => {
      let sd = JSON.stringify(this.newsgroup_data());
      if (sd != this.savedData) {
        e.preventDefault();
        return 'There are unsaved changes.';
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
      if (this.curNode && this.curNode.path == path)
        this.curNode.fold = !this.curNode.fold;
      else
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

    $(`#${this.id} .btn-permission`).on('click', e => {
      if (this.curNode)
        this.permission_dlg();
    });
  }

  async redisplay(bFromDB: boolean = false) {
    if (bFromDB) {
      this.newsgroups = await get_json('/admin/api/newsgroup') as INewsgroupAdmin[];
      // this.membership = await get_json('/api/membership') as IMembership;
      let old_root = this.root;
      this.root = new NewsgroupAdminTree(this, '', '');
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
    let scroller = `#${this.id} .newsgroup-tree >div`;
    let sy = $(scroller).scrollTop() || 0;
    $('#' + this.id).html(this.innerHtml());
    this.bind();
    $(scroller).scrollTop(sy);
  }

  detailHtml(): string {
    const i18next = this.parent.i18next;
    if (this.curNode) {
      let c = this.curNode;
      let postable = c.newsgroup ? c.newsgroup.bLocked == 0 : false
      return div({ class: 'newsgroup-detail' },
        tag('form',
          form_row(i18next.t('newsgroup'), 3, span({ class: 'path' }, c.path)),
          !c.hasChild() ?
            form_row('', 3,
              form_check('ng-bLocked', i18next.t('submissions-are-not-allowed'), !postable)) : '',
          postable ?
            form_row(i18next.t('access-control'), 3, button({ class: 'form-row btn-permission', type: 'button' },
              this.permission_html('Read:', 'rpl'), this.permission_html('Write:', 'wpl'))) : '',
          div({ class: 'form-group' },
            label({ class: 'form-label' }, i18next.t('newsgroup-description') as string),
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
    let m = this.parent.user.membership;
    return span({ class: 'permission' }, span(title), span('&ge;'),
      span(m[val] ? m[val].name : ''))
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
    let i18next = this.parent.i18next;
    return new Promise((resolve, reject) => {
      let sd = JSON.stringify(this.newsgroup_data());
      if (sd == this.savedData) {
        resolve(false);
        return;
      }
      $.confirm({
        title: i18next.t('confirm'),
        content: i18next.t('save-changes?'),
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

  new_newsgroups_dlg(parent: NewsgroupAdminTree | null = null) {
    let i18next = this.parent.i18next;
    let upper_node = '';
    if (parent) {
      upper_node = div({ class: 'parent' }, span(i18next.t('parent-newsgroup:') as string),
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
          placeholder: i18next.t('enter-newsgroup-names') as string
        })
      ),
      buttons: {
        ok: () => {
          let lines = $('#new-newsgroups').val() as string;
          let bad_names: string[] = [];
          let names: any[] = [];
          let rpl = 0;
          let wpl = 1;
          if (parent && parent.newsgroup) {
            rpl = parent.newsgroup.rpl;
            wpl = parent.newsgroup.wpl;
          }
          for (let line0 of lines.split('\n')) {
            let line = line0.trim();
            if (line == '') continue;
            if (line.match(newsgroup_pat))
              names.push({ name: parent ? parent.path + '.' + line : line, rpl, wpl });
            else
              bad_names.push(line);
          }
          if (bad_names.length > 0) {
            $.alert({
              content: div(i18next.t('inappropriate-names') as string,
                div(bad_names.join(','))
              )
            });
            return false;
          }
          get_json('/admin/api/newsgroup', { method: 'post', data: { insert: JSON.stringify(names) } }).then(() => {
            this.redisplay(true).then(() => {
              this.setNewsgroupOrder();
            });
          });
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

  async deleteMarkedNewsgroup(node: NewsgroupAdminTree, result: { cnt: number, list: string[] }): Promise<boolean> {
    let children: NewsgroupAdminTree[] = [];
    for (let c of node.children) {
      let deleted = await this.deleteMarkedNewsgroup(c, result);
      if (!deleted) children.push(c);
    }
    if (!node.bDeleted || children.length > 0 && node.newsgroup && node.newsgroup.max_id > 0) {
      node.children = children;
      return false;
    } else {
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
    let i18next = this.parent.i18next;

    $.confirm({
      title: 'newsgroup permission setting',
      type: 'green',
      columnClass: 'large',
      content: div({ class: 'permission-dlg' },
        this.permission_select('Read:', 'rpl', rpl),
        this.permission_select('Write:', 'wpl', wpl)),
      buttons: {
        ok1: {
          text: i18next.t('change-only-this-newsgroup'),
          action: () => {
            let rpl = $('.permission-dlg .rpl').val() as string;
            let wpl = $('.permission-dlg .wpl').val() as string;
            this.set_permission('node', rpl, wpl);
          }
        },
        ok2: {
          text: i18next.t('lower-level-newsgroups-also-changed'),
          action: () => {
            let rpl = $('.permission-dlg .rpl').val() as string;
            let wpl = $('.permission-dlg .wpl').val() as string;
            this.set_permission('tree', rpl, wpl);
          }
        },
        cancel: {
          text: i18next.t('cancel')
        }
      }
    });
  }

  permission_select(label_str: string, class_str: string, val: number): string {
    let opt = '';
    let membership = this.parent.user.membership;
    for (let i in membership) {
      let m = membership[i];
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

  async db_check_and_repair_dlg() {
    let i18next = this.parent.i18next;
    let r = await admin_api_db_check();
    let c = '';
    if (r.error_count == 0)
      c = i18next.t('no-db-error-found');
    else {
      c = div(i18next.t('n-db-error-found', { n: r.error_count }),
        ul({ class: 'errors' }, ...r.errors.map(s =>
          li(span({ class: 'message' }, s.message))))
      );
    }
    $.confirm({
      title: i18next.t('db-check-and-repair'),
      type: 'green',
      columnClass: r.error_count > 0 ? 'xlarge' : 'medium',
      content: div({ class: 'db-check-and-repair-dlg' }, c),
      buttons: {
        repair: {
          text: i18next.t('repair-db'),
          action: async () => {
            let r = await admin_api_db_repair();
            $.alert(i18next.t('n-db-errors-repaired', { n: r.count }))
          }
        },
        close: {
          text: i18next.t('close')
        }
      },
      onOpenBefore() {
        if (r.error_count == 0)
          this.buttons.repair.hide();
      }
    })
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

