import { IAttachment } from "./dbif";
import { div, icon, span, button, input } from "./tag";
import { size_str } from "./util";

var sn = 0;

export class Attachment {
  public id: number;
  public file: File | undefined;
  public onDelete: (() => void) | null = null;
  public comment: string = '';
  public obj: IAttachment | undefined;

  constructor(arg: File | IAttachment) {
    this.id = sn++;
    if (arg instanceof File)
      this.file = arg;
    else {
      this.obj = arg;
      this.comment = arg.comment;
    }
  }

  html(): string {
    let filename = this.file ? this.file.name : this.obj ? this.obj.filename : '';
    let size = this.file ? this.file.size : this.obj ? this.obj.size : 0;

    return div({ id: this.id, class: 'attachment' },
      div({ class: 'd-flex' },
        icon('file-earmark-arrow-up file-mark'),
        span({ class: 'name' }, filename),
        span({ class: 'size' }, size_str(size)),
        span({ class: 'flex-fill' }),
        button({ class: 'btn-close btn btn-sm', type: 'button', 'title-i18n': 'delete-this-attachment' },
          icon('x-square'))),
      div({ class: 'd-flex' }, input({ type: 'text', class: 'flex-fill comment', placeholder: 'input comment for this file', value: this.comment })));
  }

  bind() {
    $(`#${this.id} .btn-close`).on('click', () => {
      if (this.onDelete)
        this.onDelete();
    });
    $(`#${this.id} input.comment`).on('change', e => {
      this.comment = $(e.currentTarget).val() as string;
    });
  }

  data() : [string,string]|[string] {
    if (this.obj) return [this.comment, this.obj.file_id];
    else return [this.comment];
  }
}