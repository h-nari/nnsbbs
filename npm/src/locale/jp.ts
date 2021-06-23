import { a, div } from "../tag";

export const jp = {
  translation: {
    'show-all-newsgroups': '全ての掲示板を表示',
    'only-subscribed-newsgroups': '購読した掲示板のみ表示',
    'show-unsubscribed-newsgroups': '未購読の掲示板も表示',
    'close-titles-and-article-pane': 'タイトル・記事領域を閉じる',
    'thread-display': 'スレッド表示',
    'time-order-display': '投稿順表示',
    'goto-end': '最後に移動',
    'goto-begin': '先頭に移動',
    'next-unread-article': '次の未読記事に移動',
    'previous-unread-article': '前の未読記事に移動',
    'close-article': '記事領域を閉じる',
    'toggle-article-header': '記事のヘッダの表示を切替',
    'make-all-read': '全て既読にする',
    'make-all-unread': '全て未読にする',
    'make-unread-last-50': '最新50記事だけ未読にする',
    'article': '記事',
    'mark-article-as-read': '既読にする',
    'mark-article-as-unread': '未読にする',
    'subscribe': '購読中',
    'unsubscribe': '未購読',
    'display-setting': '表示設定',
    'subscribe-newsgroup': '掲示板を購読',
    'no-subscribed-newsgroup': '購読している掲示板はありません',
    'end-click-to-next': '- 記事終わり - クリックで次の記事表示します -',
    'total-articles': '総記事数',
    'unread-articles': '未読記事数',
    'load-previous-100-titles': '以前の100タイトルを読み込む',
    'load-all-previous-titles': '以前の全てのタイトルを読み込む',
    'load-next-100-titles': '以降の100タイトルを読み込む',
    'load-all-subsequent-titles': '以降の全てのタイトルを読み込む',
    'post-new-article': '記事を投稿',
    'reply-to-article': '記事に返信',
    'quote-article': '記事を引用する',
    'login-failed': 'ログインに失敗しました',
    'show-profile': 'ユーザ プロフィール',
    'user-id': 'ユーザID',
    'disp_name': '表示名',
    'last-post': '最終投稿',
    'membership': '党員資格',
    'attach-file': '添付ファイル',
    'delete-this-attachment': 'この添付ファイルを削除',
    'collapse-all-hierarchies': '階層を全て折り畳む',
    'expand-all-hierarchies': '階層を全て展開する',
    'create-a-new-newsgroup': '掲示板の新規作成',
    'change-the-order-of-the-top-level-newsgroups': 'トップレベル.掲示板の並び変更',
    'delete-marked-newsgroups-that-can-be-deleted': 'マーク済の削除可能な掲示板を削除',
    'confirm': '確認',
    'Are-you-sure-you-want-to-delete-it?': '本当に削除しますか？',
    'deleted-n-newsgroups': '{{n}}個の掲示板を削除しました',
    'also-show-deleted-newsgroups': '削除された掲示板も表示',
    'submissions-are-not-allowed': '投稿不可',
    'save-changes?': '変更を保存しますか',
    'parent-newsgroup': '親掲示板',
    'enter-newsgroup-names': '作成する掲示板の名前を入力して下さい。\n複数可',
    'inappropriate-names': '以下の名前は掲示板名として不適当です。',
    'change-only-this-newsgroup': 'この掲示板のみ変更',
    'lower-level-newsgroups-also-changed': '下位の掲示板も変更',
    'cancel': 'キャンセル',
    'create-subordinate-newsgroups': '下位掲示板を作成',
    'remove-delete-flag': '削除取消',
    'remove-delete-flag-of-lower-levels': '下位階層も削除取消',
    'delete': '削除',
    'rename': '名称変更',
    'reordering': '順番変更',
    'fold-all': '全て折り畳む',
    'unfold-all': '全て展開',
    'unfold-to-one-layer-down': '1層下まで展開',
    'cannot-delete-tree': '下位階層掲示板があるので削除できません。下位階層含めて削除フラグをつけますか？',
    'cannot-delete-posted-group': '記事が投稿済なので削除できません。削除フラグをつけますか？',
    'delete-or-flag': '本当に削除しますか？それとも削除フラグだけにしますか？',
    'rename-newsgroup': '掲示板の名称変更',
    'only-this-newsgroup': 'この掲示板だけ変更',
    'change-also-lower-layer': '下位の掲示板も変更',
    'name-is-blank': '名前が空です',
    'name-not-changed': '名前が変更されていません',
    'name-format-is-incorrect': '名前の形式が正しくありません',
    'logout': 'ログアウト',
    'login': 'ログイン',
    'Profile': 'ユーザ・プロファイル',
    'user-manager': 'ユーザ管理',
    'newsgroup-manager': '掲示板管理',
    'User Registration': 'ユーザ登録',
    'email-used-to-register': '登録に使用したメールアドレス',
    'displayed-as-username': 'ユーザ名として表示されます。変更可能',
    'disp-name': '表示名',
    'select-your-membership': '党員資格を選択して下さい',
    'profile': 'プロファイル',
    'fill-in-your-self-introduction': '自己紹介を記入して下さい。ここに書かれた内容は公開されますので注意して下さい。',
    'write': '書込み',
    'close': '閉じる',
    'subject': '表題',
    'body': '本文',
    'post-article': '記事投稿',
    'specify-attachments-images': '添付ファイル/画像の指定',
    'select-files': 'ファイルを選択して下さい',
    'change-user-setting': 'ユーザ情報設定',
    'log-out?': '本当にログアウトしますか？',
    'email': 'メール',
    'password': 'パスワード',
    'forget-password': 'パスワードを忘れたら',
    'user-registration': '新規ユーザ登録',
    'enter-email-for-authentication': '認証用のメールアドレスを入力してください。入力されたアドレスに認証用のURLが送信されます。',
    'input-email': 'メールアドレスを入力して下さい',
    'sent-url': '入力されたメールアドレスに認証用URLを送信しました。<br/>メールを開いて、認証用URLをブラウザで開いてください。',
    'bad-format-email': 'メールアドレスの形式が正しくありません。',
    'no-password': 'パスワードが入力されていません',
    'newsgroup': '掲示板',
    'access-control': '権限設定',
    'newsgroup-description': '掲示板の説明',
    'post': '投稿する',
    'add-response': '反応を返す',
    'good': 'いいね',
    'i-dont-think-so': '私はそうは思わない',
    'i-dont-understand': '言っていることが理解できない',
    'no-reaction': '反応しない',
    'report': '通報する',
    'report-post-to-administrator': '投稿を管理者に通報する',
    'crime-to-be-reported': '通報すべき犯罪行為',
    'obscene-expression': '猥褻な表現',
    'violation-of-copyright': '著作権侵害',
    'insulting-behavior': '侮辱行為',
    'malicious-hoax': '悪意のあるデマ',
    'leak-of-personal-information': '個人情報漏洩',
    'phishing': 'フィッシング行為',
    'spam': 'スパム',
    'other': 'その他',
    'article-to-be-reported': '通報対象の記事',
    'type-of-violation': '違反の種類',
    'report-detail': '通報の詳細',
    'i-have-reported-the-post-to-the-administrator': '投稿を管理者に通報しました',
    'login-needed': 'ログインが必要です',
    'login-needed-to-add-reaction': '反応するにはログインが必要です',
    'report-detail-is-blank': '通報の詳細が空欄です',
    'error': 'エラー',
    'report-manager': '通報管理',
    'id': 'ID',
    'reported-at': '通報時間',
    'notifier': '通報者',
    'type': '種類',
    'treatment': '処置',
    'article-title': '記事標題',
    'not-yet': '未処置',
    'no-treatment-required': '処置の必要なし',
    'partial-correction-of-the-article': '記事部分修正',
    'prohibit-the-display-of-articles': '記事表示禁止',
    'report-to-the-police': 'その筋に通報',
    'report-no': '通報番号',
    'report-type': '種類',
    'report-time': '通報時刻',
    'article-author': '記事投稿者',
    'article-posted-at': '投稿時刻',
    'treatment-at': '処置時刻',
    'treatment-detail': '処置詳細',
    'treat-input': '処置入力',
    'under-consideration': '検討中',
    'to-report-list': '通報一覧へ',
    'treatment-filer': '処置フィルター',
    'check-all': '全てチェック',
    'execute': '実行',
    'type-filter': '種別フィルター',
    'there-is-no-data-to-display': '表示するデータはありません',
    'setting': '設定',
    'theme': 'テーマ',
    'correct-article': '記事訂正',
    'mail-used-to-register': 'ユーザー登録に使用したメールアドレス',
    'signature': '署名',
    'signature-insert-into-article': '記事の最後に挿入される署名',
    'too-big-file-bigger-than-100m': '添付可能なファイルサイズの上限は100Mbyteです',
    'show-next-unread-article': '次の未読記事を表示',
    'scroll-to-show-the-selected-line': '選択された記事が表示されるようにスクロールする',
    'password-reset': 'パスワードを忘れたら',
    'enter-email-for-password-reset': 'パスワード再設定のURLを送りますので、登録したメールアドレスを入力して下さい',
    'email-is-already-used': 'このメールアドレスは既に使用されています',
    'show-deleted-article': '非表示の記事を表示',
    'ban-article': '記事非表示設定',
    'ban': '非表示',
    'delete-reason': '非表示にする理由',
    'target-article': '対象記事',
    'drag-newsgroup-to-reorder': '掲示板名をドラッグし順番を変更して下さい',
    'reorder-newsgroups': '掲示板順序変更',
    'set': '設定',
    'subscribed': '購読中',
    'unsubscribed': '未購読',
    'no-of-subscribed-newsgroups': '購読中の掲示板数',
    'no-of-newsgroups': '掲示板数',
    'no-of-articles': '記事数',
    'posted-at': '投稿日時:',
    'about-newsgroup': 'この掲示板の説明',
    'subscribe-all': '全て購読する',
    'unsubscribe-all': '全て購読を止める',
    'reload': '再読み込み',
    'board-f-articles': '掲示板 <b>{{f}}</b> の記事を',
    'articles-under-f': '<b>{{f}}</b> 以下の掲示板の記事を',
    'read-info-management': '記事の既読管理',
    'make-unread-last-n': '最後の指定個数だけ未読にする',
    'specified-number': '指定個数',
    'no-unread-article': '未読記事はありません',
    'no-permission-to-post': div(
      div('党員以外はこの掲示板には投稿できません。'),
      div('参政党サポータ(無料)で投稿可能になります。'),
      div('詳しくは', a({ href: 'https://www.sanseito.jp/supporter/' },
        'こちらのページ'), 'を御覧ください')
    ),
    'db-check-and-repair': 'データベースのチェックと修復',
    'no-db-error-found': 'データベースにエラーは見つかりませんでした',
    'n-db-error-found': 'データベースに{{n}}個のエラーが見つかりました',
    'repair-db': 'データベースを修復する',
    'n-db-errors-repaired': 'データベースの{{n}}個のエラーが修復されました',
    'num-subscribed': '購読数',
    'num-unread': '未読記事数',
    'num-newsgroups': '掲示板数',
    'this-article-cannot-be-displayed-because-it-has-been-disabled': 'この記事は表示禁止になっているので表示できません'
  }
};
