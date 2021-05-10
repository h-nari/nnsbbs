import { div, icon, span, button, input } from "./tag";
import { size_str } from "./util";

var sn = 0;

export class Attachment {
  public id: number;
  public file: File
  public onDelete: (() => void) | null = null;
  public comment: string = '';

  constructor(file: File) {
    this.id = sn++;
    this.file = file;
  }

  html(): string {
    return div({ id: this.id, class: 'attachment' },
      div({ class: 'd-flex' },
        icon('file-earmark-arrow-up file-mark'),
        span({ class: 'name' }, this.file.name),
        span({ class: 'size' }, size_str(this.file.size)),
        span({ class: 'flex-fill' }),
        button({ class: 'btn-close btn btn-sm', type: 'button', 'title-i18n': 'delete-this-attachment' },
          icon('x-square'))),
      div({ class: 'd-flex' }, input({ type: 'text', class: 'flex-fill comment', placeholder: 'input comment for this file' })));
  }

  bind() {
    $(`#${this.id} .btn-close`).on('click', () => {
      if (this.onDelete)
        this.onDelete();
    });
    $(`#${this.id} input.comment`).on('change', e => {
      this.comment = $(e.currentTarget).val() as string;
      console.log('comment change:', this.comment);
    });
  }
}