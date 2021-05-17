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
    'newsgroup.management'  => 'ニュースグループ管理',
    'access.mail_auth.link' =>
      "メールアドレスの認証を完了させるために\n"
      . "次のURLをアクセスして下さい。\n\n",
    'ignore.if.no.idea' => "このメールに心当たりがない場合は\n無視して下さい。",
    "email.title" => "NnsBbsメール認証",
    "report.manager" => "通報管理"
);

1;

