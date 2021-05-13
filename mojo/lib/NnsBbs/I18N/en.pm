package NnsBbs::I18N::jp;
use Mojo::Base 'Locale::Maketext';
use utf8;

our %Lexicon = (
    'Email.verification.successful' => 'Email verification successful.',
    'fill.in.form' =>
      'Please fill in the form below to complete your user registration.',
    'id.is.not.correct' => "The id is not correct.",
    'email.is.not.same' =>
      "My email address is different from the one used for authentication.",
    'email.is.already.used' =>
      "Email address is already in use (internal error)",
    'disp_name.is.blank' => "Display name is not entered.",
    'password.is.blank'  => "Password is not entered.",
    'too.short.password' =>
      "Your password is too short, please make it more than 8 characters.",
    'password.is.not.same' => "Confirmation password does not match.",
    'error.in.registration' =>
      "There is an error in your registration information.",
    'user.information '    => 'User information',
    'user.management'      => 'User management',
    'newsgroup.management' => 'Newsgroup management',
    'access.mail_auth.link' =>
      "To complete the authentication of the email address \n"
      . "Please access the following URL. \n\n",
    'ignore.if.no.idea' => "If you do not recognize this email, please \n"
      . "Please ignore it.",
    "email.title" => "NnsBbs Email Authentication"
);

1;

