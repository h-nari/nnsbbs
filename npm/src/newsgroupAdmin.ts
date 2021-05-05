import NnsBbs from "./nnsbbs";
import { tag, div, span, table, td, th, tr, button, label, selected, input } from "./tag";
import { get_json } from "./util";

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
  private root: NewsgroupTree = new NewsgroupTree('', '');
  private curNode: NewsgroupTree | null = null;

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
    $(`#${this.id} .btn-fold`).on('click', e => {
      let t = e.currentTarget;
      if (t.parentElement) {
        let path = t.parentElement.attributes['path'].value as string;
        let node = this.root.allocNewsgroup(path);
        node.fold = !node.fold;
        this.redisplay();
      }
    });
    $(`#${this.id} .newsgroup-line`).on('click', e => {
      let path = $(e.currentTarget).attr('path') || '';
      this.curNode = this.root.allocNewsgroup(path);
      this.redisplay();
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
    this.root.number(1);
    this.redisplay();
  }

  detailHtml(): string {
    if (this.curNode) {
      let c = this.curNode;
      return div({ class: 'newsgroup-detail' }, tag('h3', c.path),
        tag('form',
          form_row('パス', 3, input({ id: 'ng-name', class: 'form-control', value: c.path })),
          form_row('', 3,
            form_check('ng-bLocked', '投稿不可', c.newsgroup ? c.newsgroup.bLocked : 1) +
            form_check('ng-bDeleted', '削除', c.newsgroup ? c.newsgroup.bDeleted : 0)),
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

  save() {
    let tree_node = this.curNode;
    if (!tree_node) return;

    let name = $('#ng-name').val() as string;
    let bLocked = $('#ng-bLocked').prop('checked');
    let bDeleted = $('#ng-bDeleted').prop('checked');
    let comment = $('#ng-comment').val();
    let data: any;
    if (tree_node.newsgroup)
      data = {
        write: JSON.stringify([{
          id: tree_node.newsgroup.id, name, bDeleted, bLocked, comment
        }])
      };
    else
      data = {
        new: JSON.stringify([{ name, bDeleted, bLocked, comment }])
      };
    console.log('data:', data);
    get_json('/admin/api/newsgroup', { method: 'post', data }).then(() => {
      this.init();
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
}

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
  public name: string;
  public path: string;
  public newsgroup: (INewsgroupAdmin | null) = null;
  public children: NewsgroupTree[] = [];
  public ord0: number = 0;
  public ord: number = 0;
  public fold: boolean = false;

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
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
    let c = new NewsgroupTree(name, path);
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

  number(n: number): number {
    let i = n;
    this.ord = i++;
    for (let c of this.children)
      i = c.number(i);
    return i;
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

    return div({ class: 'sub-tree', fold: selected(this.fold) },
      div({ path: this.path, class: this == selected_node ? 'newsgroup-line selected' : 'newsgroup-line' },
        span({ class: 'name' }, this.name),
        fold_icon,
        this.newsgroup ? span({ class: 'bi-newspaper' }) : ''),
      this.fold ? '' : div(this.sub_html(selected_node))
    );
  }
};

