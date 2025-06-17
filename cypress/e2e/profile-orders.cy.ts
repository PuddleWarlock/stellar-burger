import { SELECTORS } from 'cypress/support/selectors';

describe('История заказов пользователя', () => {
  beforeEach(() => {

    cy.intercept('GET', '/api/auth/user', { fixture: 'user.json' }).as(
      'getUser'
    );
    cy.intercept('GET', '/api/orders', { fixture: 'user-orders.json' }).as(
      'getUserOrders'
    );
    cy.intercept('GET', '**/api/ingredients', {
      fixture: 'ingredients.json'
    }).as('loadIngredients');

    cy.setAuthTokens();
    cy.visit('/profile/orders');


    cy.wait(['@getUser', '@loadIngredients', '@getUserOrders']);
  });

  it('Отображает список заказов пользователя', () => {
    cy.get('[data-testid="orders-list"]').should('exist');
    cy.get('[data-testid="orders-list"] > [data-testid="order-item"]').should(
      'have.length.be.greaterThan',
      0
    );
    cy.contains('User Test Order 1').should('exist');
    cy.contains('#000101').should('exist');
  });

  it('При клике на заказ открывается модальное окно с деталями', () => {

    cy.get('[data-testid="orders-list"] > [data-testid="order-item"]')
      .first()
      .click();

    cy.get(SELECTORS.MODAL.CONTENT).should('be.visible');
    cy.get(SELECTORS.MODAL.CONTENT)
      .contains('User Test Order 1')
      .should('be.visible');

  });

  it('Прямой переход на URL заказа пользователя открывает детали на странице', () => {
    const orderNumber = '101';
    cy.intercept('GET', `/api/orders/${orderNumber}`, {
      fixture: 'single-order.json'
    }).as('getSingleOrderPage');

    cy.setAuthTokens();
    cy.visit(`/profile/orders/${orderNumber}`);

    cy.wait(['@getUser', '@getSingleOrderPage']);
    cy.get('[data-testid="preloader"]').should('not.exist');

    cy.get(SELECTORS.MODAL.CONTENT).should('not.exist');
    cy.contains('h3', 'Test Order').should('be.visible');

  });
});
