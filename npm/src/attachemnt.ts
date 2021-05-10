import { div, icon, span, button } from "./tag";

var sn = 0;

export class Attachment {
  public id: number;
  public file: File
  public onDelete: (() => void) | null = null;

  constructor(file: File) {
    this.id = sn++;
    this.file = file;
  }

  html(): string {
    let size = this.file.size;
    const kilo = 1024;
    const mega = kilo * kilo;
    const giga = mega * kilo;
    let size_str = size + ' bytes';

    if (size > giga)
      size_str = (size / giga).toFixed(2) + 'Gbyte';
    else if (size > 100 * mega)
      size_str = (size / mega).toFixed(0) + 'Mbyte'
    else if (size > 10 * mega)
      size_str = (size / mega).toFixed(1) + 'Mbyte'
    else if (size > 1 * mega)
      size_str = (size / mega).toFixed(2) + 'Mbyte'
    else if (size > 100 * kilo)
      size_str = (size / kilo).toFixed(0) + 'Kbyte'
    else if (size > 10 * kilo)
      size_str = (size / kilo).toFixed(1) + 'Kbyte'
    else if (size > 1 * kilo)
      size_str = (size / kilo).toFixed(2) + 'Kbyte'

    return div({ id: this.id, class: 'attachment d-flex' },
      icon('file-earmark-arrow-up file-mark'),
      span({ class: 'name' }, this.file.name),
      span({ class: 'size' }, size_str),
      span({ class: 'flex-fill' }),
      button({ class: 'btn-close btn btn-sm', type: 'button', 'title-i18n': 'delete-this-attachment' },
        icon('x-square')));
  }

  bind() {
    $(`#${this.id} .btn-close`).on('click', () => {
      if (this.onDelete)
        this.onDelete();
    });
  }
}