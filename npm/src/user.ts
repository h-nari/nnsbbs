import { div, input, button, tag, label, a, span } from './tag';
import { get_json } from './util';
import { createHash } from 'sha1-uint8array';

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
        )),
      buttons: {
        login: {
          text: 'Login',
          action: async () => {
            console.log('login');
            let email = $('#email').val() as string;
            let password = $('#inputPassword').val() as string;
            let sha = createHash('sha1');
            sha.update(password);
            let pwd = sha.digest('hex');
            let data = await get_json('/api/login', { data: { email, pwd } });
            console.log('data:', data);
          }
        },
        cancel: {
          text: 'Cancel',
          action: () => { }
        }
      }
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
              input({ type: 'text', class: 'form-control', id: 'email', placeholder: 'email@example.com' }))))),
      buttons: {
        ok: {
          text: 'ok',
          action: () => {
            let email: string = $('#email').val() as string;
            if (!email) {
              $.alert('Please enter your email address');
              return false;
            } else if (!email.match(/[\w.]+@(\w+\.)+\w+/)) {
              $.alert('The email address format is incorrect.');
              return false;
            } else {
              get_json('/api/mail_auth', { data: { email } }).then((d: any) => {
                console.log('d:', d);
                if (d.result == 0) {
                  $.alert('failed:' + d.mes);
                  return false;
                } else {
                  $.alert(div('An authentication URL has been sent to the email address you entered.') +
                    div('Please open the email and open the URL for authentication with your browser.'));
                }
              }).catch(e => {
                console.log('Error:', e);
                $.alert(e);
              });
            }
          }
        },
        cancel: {
          text: 'cancel',
          action: () => { }
        }
      }
    });
  }
}