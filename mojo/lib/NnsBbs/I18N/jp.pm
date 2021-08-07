package NnsBbs::I18N::jp;
use Mojo::Base 'NnsBbs::I18N';
use utf8;

our %Lexicon = (
    'Email.verification.successful' => 'メール認証に成功しました',
    'fill.in.form' =>
      '下記に入力し、ユーザ登録を完了させて下さい',
    'id.is.not.correct' => "idが正しくありません",
    'email.is.not.same' =>
      "メールアドレスが認証に使用したものと違います",
    'email.is.already.used' =>
      "メールアドレスが既に使用されています(内部エラー)",
    'disp_name.is.blank' => "表示名が入力されていません",
    'password.is.blank'  => "パスワードが入力されていません",
    'too.short.password' =>
      "パスワードが短すぎます。8文字以上にしてください",
    'password.is.not.same'  => "確認用パスワードが一致しません",
    'error.in.registration' => "登録情報にエラーがあります",
    'user.information '     => 'ユーザ情報',
    'user.management'       => 'ユーザ管理',
    'newsgroup.management'  => '掲示板管理',
    'access.mail.auth.link' =>
      "メールアドレスの認証を完了させるために\n"
      . "次のURLをアクセスして下さい。\n\n",
    'access.password.reset.link' =>
"パスワードを再設定するため 次のURLをアクセスして下さい\n\n",
    'ignore.if.no.idea' =>
"このメールに心当たりがない場合は\n無視して下さい。",
    'email.title'                => 'NnsBbsメール認証',
    'report.manager'             => '通報管理',
    'id.is.not.registered'       => 'このIDは登録されていません',
    'fail.to.mail.authorization' => 'メール認証に失敗しました',
    'fail.to.reset.password' =>
      'パスワードのリセットに失敗しました',
    'reset.password' => 'パスワード再設定',
    'mail.address'   => 'メールアドレス',
    'input.email' =>
'確認用、認証に使用したメールアドレスを入力してください。',
    'auth.id'   => '認証ID',
    'disp-name' => '表示名',
    'disp-name-explain' =>
'掲示板で名前として表示されます。本名である必要はありません。
        いつでも変更可能です。',
    'password' => 'パスワード',
    'input.password' =>
'ログイン用のパスワードを入力してください。(8文字以上)',
    'password.for.confirm' => 'パスワード(確認)',
    'password.for.confirm.explain' =>
      '確認用に上と同じパスワードを入力して下さい。',
    'change.password'            => 'パスワード変更',
    'user.registration'          => 'ユーザ登録',
    'user.registration.complete' => 'ユーザ登録完了',
    'password.reset.complete'    => 'パスワード変更完了',
    'enjoy.bbs' => 'ログインし掲示板をお楽しみ下さい。',
    'ie-cannot-display' =>
      'Internet Explorerでは、この掲示板を表示できません',
    'recommended-browsers' =>
      'Chrome, Firefox, Edge, Safariなどをご使用ください',
    'notify.mail.subject' => '[_2]掲示板 未読記事が[_1]件あります',
    'notify.mail.preamble' => join( "\n",
        "このメールは[_1]の参加者に",
        "掲示板の未読記事をお知らせするメールです。",
        "\n" ),
    'notify.mail.postamble' => join( "\n",
        "\nこのメールの配信を止めたい場合は、",
        "[_1]",
        "のURLよりログインし「設定」で",
        "通知を止めるとしてください。",
        "\n" ),
    'accept.email' => 'メールを受け取る',
    'accept.email.explain' =>
      '[_1]関連のお知らせのメールを受け取る',
);

1;

