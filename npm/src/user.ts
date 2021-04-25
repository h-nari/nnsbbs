import { div, input, button, tag, label, a, span } from './tag';


export class User {
  bind() {
    $('.menu-login').on('click', e => {
      this.login();
      e.preventDefault();
    });
    $('.menu-logout').on('click', e => {
      $.confirm('logout');
      e.preventDefault();
    });
    $('.menu-registration').on('click', e => {
      this.user_registration();
      e.preventDefault();
    });
  }

  login() {
    $.confirm({
      title: 'Login',
      type: 'blue',
      columnClass: 'large',
      content: div({ class: 'login' },
        tag('form',
          div({ class: 'form-group row' },
            label({ for: 'email', class: 'col-sm-3 col-form-label' }, 'Email'),
            div({ class: 'col-sm-6' }, input({ type: 'text', class: 'form-control', id: 'email', placeholder: 'email@example.com' }))),
          div({ class: 'form-group row' },
            label({ for: 'inputPassword', class: 'col-sm-3 col-form-label' }, 'Password'),
            div({ class: 'col-sm-6' }, input({ type: 'password', class: 'form-control', id: 'inputPassword', placeholder: 'Password' })))),
        div({ class: 'login-links' },
          a({ href: '#' }, 'forget Password'),
          a({ href: '#' }, 'User registration'),
          a({ href: '#' }, 'merits of user registration')
        ))
    });
  }

  user_registration() {
    $.confirm({
      title: 'User registration',
      type: 'green',
      columnClass: 'large',
      content: div({ class: 'user-registration' },
        div({ class: 'explain' },
          'Please enter your email address for authentication.',
          '  A URL for authentication will be sent to the address you entered.'),
        tag('form',
          div({ class: 'form-group row' },
            label({ for: 'email', class: 'col-sm-3 col-form-label' }, 'Email'),
            div({ class: 'col-sm-6' },
              input({ type: 'text', class: 'form-control', id: 'email', placeholder: 'email@example.com' })))))
    });
  }
}