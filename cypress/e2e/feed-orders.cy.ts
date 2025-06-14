import { SELECTORS } from 'cypress/support/selectors';

describe('Лента заказов', () => {
  beforeEach(() => {

    cy.intercept('GET', '/api/auth/user', { fixture: 'user.json' }).as('getUser');



    cy.intercept('GET', '/api/orders/all', {
      fixture: 'user-orders.json'
    }).as('getFeedOrders');


    cy.intercept('GET', '**/api/ingredients', {
      fixture: 'ingredients.json'
    }).as('loadIngredients');


    cy.setAuthTokens();

    cy.visit('/feed');


    cy.wait(['@getUser', '@loadIngredients', '@getFeedOrders']);
  });

  it('Отображает список всех заказов в ленте', () => {
    cy.get('[data-testid="orders-list"]').should('exist');

    cy.get('[data-testid="orders-list"] > [data-testid="order-item"]').should(
      'have.length.be.greaterThan',
      0
    );
    cy.contains('Выполнено за все время')
      .next()
      .should('exist')
      .and('not.be.empty');
    cy.contains('Выполнено за сегодня')
      .next()
      .should('exist')
      .and('not.be.empty');
    cy.contains('User Test Order 1').should('exist');
    cy.contains('#000101').should('exist');
  });

  it('При клике на заказ из ленты открывается модальное окно с деталями', () => {




    cy.get('[data-testid="orders-list"] > [data-testid="order-item"]')
      .first()
      .click();





    cy.get(SELECTORS.MODAL.CONTENT).should('be.visible');




    cy.get(SELECTORS.MODAL.CONTENT)
      .contains('User Test Order 1')
      .should('be.visible');



    cy.get(SELECTORS.MODAL.CONTENT)
      .contains('Флюоресцентная булка R2-D3')
      .should('be.visible');

    cy.get(SELECTORS.MODAL.CONTENT)
      .contains('Соус фирменный Space Sauce')
      .should('be.visible');

    cy.get(SELECTORS.MODAL.CONTENT)
      .contains('Хрустящие минеральные кольца')
      .should('be.visible');


    cy.get(SELECTORS.MODAL.CONTENT)
      .contains('Состав:')
      .should('be.visible');

  });

  it('Модальное окно с деталями заказа из ленты закрывается по крестику', () => {

    cy.get('[data-testid="orders-list"] > [data-testid="order-item"]').first().click();

    cy.get(SELECTORS.MODAL.CONTENT).should('exist');
    cy.closeModal('close-button');
  });

  it('Модальное окно с деталями заказа из ленты закрывается по оверлею', () => {
    cy.get('[data-testid="orders-list"] > [data-testid="order-item"]').first().click();
    cy.get(SELECTORS.MODAL.CONTENT).should('exist');
    cy.closeModal('overlay');
  });

  it('Прямой переход на URL заказа из ленты открывает детали на странице', () => {
    const orderNumber = '101';
    cy.intercept('GET', `/api/orders/${orderNumber}`, {
      fixture: 'single-order.json'
    }).as('getSingleOrderPage');

    cy.setAuthTokens();
    cy.visit(`/feed/${orderNumber}`);


    cy.wait(['@getUser', '@getSingleOrderPage']);



    cy.get('[data-testid="preloader"]').should('not.exist');

    cy.get(SELECTORS.MODAL.CONTENT).should('not.exist');


    cy.contains('h3', 'Test Order').should('be.visible');
  });
});
