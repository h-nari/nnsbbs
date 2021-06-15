// Newsgroup subscription and article read information

import { ISubsElem } from "./dbif";
import { ReadSet } from "./readSet";

export class SubsInfo {
  public newsgroup_id: string;
  public subscribe: boolean;
  public read: ReadSet;
  public update: boolean | undefined;

  constructor(newsgroup_id: string, h: ISubsElem | undefined = undefined) {
    if (h) {
      this.subscribe = h.subscribe != 0;
      this.read = new ReadSet(h.done);
      this.update = true;
    } else {
      this.subscribe = false;
      this.read = new ReadSet();
      this.update = false;
    }
    this.newsgroup_id = newsgroup_id;
  }

  subsElem(): ISubsElem {
    return {
      subscribe: this.subscribe ? 1 : 0,
      done: this.read.toString(),
      update: this.update ? 1 : 0,
      newsgroup_id: this.newsgroup_id
    }
  }
}