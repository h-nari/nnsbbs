// Newsgroup subscription and article read information

import { ISubsElem } from "./dbif";
import { ReadSet } from "./readSet";

export class SubsInfo {
  public newsgroup_id: string;
  public subscribe: boolean;
  public readset: ReadSet;
  public update: boolean | undefined;
  public max_id: number;
  public deleted_articles: number[]

  constructor(newsgroup_id: string, max_id: number, deleted_articles: number[], h: ISubsElem | undefined = undefined) {
    if (h) {
      this.subscribe = h.subscribe != 0;
      this.readset = new ReadSet(h.done);
      this.update = true;
    } else {
      this.subscribe = false;
      this.readset = new ReadSet();
      this.update = false;
    }
    this.max_id = max_id;
    this.deleted_articles = deleted_articles;
    for (let i of deleted_articles)
      this.readset.add_range(i);
    this.newsgroup_id = newsgroup_id;
  }

  subsElem(): ISubsElem {
    return {
      subscribe: this.subscribe ? 1 : 0,
      done: this.readset.toString(),
      update: this.update ? 1 : 0,
      newsgroup_id: this.newsgroup_id
    }
  }

  read(i: number | string) {
    this.readset.add_range(Number(i))
  }

  read_all(last: number = 0) {
    let last_id = this.max_id - last;
    this.readset.clear();
    if (last_id > 0)
      this.readset.add_range(1, last_id);
    for (let i of this.deleted_articles) 
      this.read(i);
  }

  unread_all() {
    this.readset.clear();
    for (let i of this.deleted_articles)
      this.read(i);
  }

  article_count() {
    return this.max_id - this.deleted_articles.length;
  }

  unread_article_count() {
    return this.subscribe ? this.max_id - this.readset.count() : 0;
  }

  first_unread_article(): number | undefined {
    if (this.readset.ranges.length == 0)
      return undefined;
    let r = this.readset.ranges[0];
    if (r[0] > 1) return 1;
    else if (r[1] >= this.max_id) return undefined;
    else return r[1] + 1;
  }

  is_read(id: string | number): boolean {
    return this.readset.includes(Number(id));
  }
}