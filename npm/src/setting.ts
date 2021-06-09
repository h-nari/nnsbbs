import { api_user_update } from "./dbif";
import { User } from "./user";

export interface ISettingData {
  showDeletedArticle: boolean;
  articleUnread: number;
}


export class Setting {
  private user: User;
  public d: ISettingData = {
    showDeletedArticle: false,
    articleUnread: 20
  };

  constructor(user: User) {
    this.user = user;
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