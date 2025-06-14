

import { SELECTORS } from 'cypress/support/selectors';

describe('Авторизация, регистрация, восстановление пароля', () => {

  beforeEach(() => {

    cy.intercept('POST', '/api/auth/register', {
      fixture: 'register-success.json'
    }).as('register');
    cy.intercept('POST', '/api/auth/login', {
      fixture: 'login-success.json'
    }).as('login');
    cy.intercept('POST', '/api/auth/logout', {
      success: true,
      message: 'successful logout'
    }).as('logout');
    cy.intercept('POST', '/api/password-reset', {
      success: true,
      message: 'Reset email sent'
    }).as('forgotPassword');
    cy.intercept('POST', '/api/password-reset/reset', {
      success: true,
      message: 'Password reset successful'
    }).as('resetPassword');
    cy.intercept('GET', '**/api/ingredients', {
      fixture: 'ingredients.json'
    }).as('loadIngredients');


    cy.clearLocalStorage();
    cy.clearCookies();
  });



  it('Успешная регистрация нового пользователя', () => {
    cy.intercept('GET', '/api/auth/user', { statusCode: 401 }).as(
      'getUserFailed'
    );

    cy.visit('/register');
    cy.wait('@getUserFailed');

    cy.get(SELECTORS.FORM.EMAIL).type('newuser@example.com');
    cy.get('input[name="name"]').type('New User');
    cy.get(SELECTORS.FORM.PASSWORD).type('newpassword');
    cy.get(SELECTORS.FORM.SUBMIT).click();

    cy.wait('@register');


    cy.url().should('include', '/');
  });

  it('Ошибка регистрации (пользователь уже существует)', () => {
    cy.intercept('GET', '/api/auth/user', { statusCode: 401 }).as(
      'getUserFailed'
    );
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 409,
      body: { success: false, message: 'User already exists' }
    }).as('registerConflict');

    cy.visit('/register');
    cy.wait('@getUserFailed');

    cy.get(SELECTORS.FORM.EMAIL).type('existing@example.com');
    cy.get('input[name="name"]').type('Existing User');
    cy.get(SELECTORS.FORM.PASSWORD).type('password');
    cy.get(SELECTORS.FORM.SUBMIT).click();

    cy.wait('@registerConflict');
    cy.url().should('include', '/register');
    cy.contains('User already exists').should('exist');
  });

  it('Успешный вход существующего пользователя', () => {
    cy.intercept('GET', '/api/auth/user', { statusCode: 401 }).as(
      'getUserFailed'
    );

    cy.visit('/login');
    cy.wait('@getUserFailed');

    cy.get(SELECTORS.FORM.EMAIL).type('test@example.com');
    cy.get(SELECTORS.FORM.PASSWORD).type('password');
    cy.get(SELECTORS.FORM.SUBMIT).click();

    cy.wait('@login');


    cy.url().should('include', '/');
  });

  it('Ошибка входа', () => {
    cy.intercept('GET', '/api/auth/user', { statusCode: 401 }).as(
      'getUserFailed'
    );
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { success: false, message: 'Invalid credentials' }
    }).as('loginFailed');

    cy.visit('/login');
    cy.wait('@getUserFailed');

    cy.get(SELECTORS.FORM.EMAIL).type('wrong@example.com');
    cy.get(SELECTORS.FORM.PASSWORD).type('wrongpassword');
    cy.get(SELECTORS.FORM.SUBMIT).click();

    cy.wait('@loginFailed');
    cy.url().should('include', '/login');
    cy.contains('Invalid credentials').should('exist');
  });



  it('Успешный выход', () => {

    cy.intercept('GET', '/api/auth/user', { fixture: 'user.json' }).as(
      'getUserSuccess'
    );
    cy.setAuthTokens();

    cy.visit('/profile');
    cy.wait('@getUserSuccess');

    cy.contains('Выход').click();
    cy.wait('@logout');
    cy.url().should('include', '/login');


    cy.intercept('GET', '/api/auth/user', { statusCode: 401 }).as(
      'getUserFailed'
    );
    cy.visit('/profile');
    cy.wait('@getUserFailed');
    cy.url().should('include', '/login');
  });



  it('Доступ к защищенным маршрутам при отсутствии авторизации перенаправляет на /login', () => {
    cy.intercept('GET', '/api/auth/user', { statusCode: 401 }).as(
      'getUserFailed'
    );

    cy.visit('/profile');
    cy.wait('@getUserFailed');
    cy.url().should('include', '/login');

    cy.visit('/profile/orders');
    cy.wait('@getUserFailed');
    cy.url().should('include', '/login');
  });

  it('Доступ к аутентификационным маршрутам при наличии авторизации перенаправляет на /', () => {
    cy.intercept('GET', '/api/auth/user', { fixture: 'user.json' }).as(
      'getUserSuccess'
    );
    cy.setAuthTokens();

    cy.visit('/login');
    cy.wait('@getUserSuccess');
    cy.url().should('eq', 'http://localhost:4000/'); // Используем 'eq' для точного совпадения

    cy.visit('/register');
    cy.wait('@getUserSuccess');
    cy.url().should('eq', 'http://localhost:4000/');
  });



  it('Восстановление пароля - успешный сценарий', () => {

    cy.visit('/forgot-password');
    cy.get(SELECTORS.FORM.EMAIL).type('test@example.com');
    cy.get(SELECTORS.FORM.SUBMIT).click();
    cy.wait('@forgotPassword');
    cy.url().should('include', '/reset-password');





    cy.contains('h3', 'Восстановление пароля').should('be.visible');

    cy.get(SELECTORS.FORM.PASSWORD).type('newpassword');
    cy.get('input[name="token"]').type('test-code');
    cy.get(SELECTORS.FORM.SUBMIT).click();

    cy.wait('@resetPassword');
    cy.url().should('include', '/login');

    cy.window().its('localStorage').invoke('getItem', 'resetPassword').should('be.null');
  });
});
