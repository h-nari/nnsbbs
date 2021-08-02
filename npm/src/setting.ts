import { api_user_update } from "./dbif";
import { User } from "./user";

export interface ISettingData {
  showDeletedArticle: boolean;
  articleUnread: number;
  notifyPost: boolean;
  notifyPostAt: number;
}


export class Setting {
  private user: User;
  public d: ISettingData = {
    showDeletedArticle: false,
    articleUnread: 20,
    notifyPost: false,
    notifyPostAt: 0
  };

  constructor(user: User) {
    this.user = user;
  }

  duplicateData(): ISettingData {
    let json = JSON.stringify(this.d);
    let d = JSON.parse(json) as ISettingData;
    return d;
  }

  isSameData(d: ISettingData): boolean {
    let json1 = JSON.stringify(this.d);
    let json2 = JSON.stringify(d);
    return json1 == json2;
  }

  setData(d: ISettingData) {
    for (let key in d)
      this.d[key] = d[key];
  }

  load(json_str: string) {
    try {
      if (json_str) {
        let obj = JSON.parse(json_str);
        for (let key in obj) {
          if (key in this.d)
            this.d[key] = obj[key];
        }
      }
    }
    catch (e) {
      console.log('setting.load error:', e);
    }
  }

  async save() {
    if (this.user.user)
      await api_user_update({ id: this.user.user.id, setting: JSON.stringify(this.d) })
  }
}