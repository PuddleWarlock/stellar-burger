import { SELECTORS } from 'cypress/support/selectors';

describe('Оформление заказа — через UI', () => {
  beforeEach(() => {

    cy.intercept('GET', '**/api/ingredients', { fixture: 'ingredients.json' }).as('loadIngredients');


    cy.intercept('GET', '/api/auth/user', { fixture: 'user.json' }).as('getUser');


    cy.intercept('POST', '/api/orders', {
      success: true,
      name: 'Test Order',
      order: {
        number: 12345

      }
    }).as('createOrder');
  });

  it('логинимся, собираем бургер, оформляем заказ', function () {

    cy.fixture('ingredients.json').as('ingredientsData');


    cy.setAuthTokens();


    cy.visit('/');


    cy.wait(['@loadIngredients', '@getUser']);


    cy.get('@ingredientsData').then((ingredientsData: any) => {
      const ingredients = ingredientsData.data;
      const bun = ingredients.find((i: { type: string; }) => i.type === 'bun');
      const main = ingredients.find((i: { type: string; }) => i.type === 'main');
      const sauce = ingredients.find((i: { type: string; }) => i.type === 'sauce');


      cy.get(`[data-testid="ingredient-${bun.type}"]`).contains('Добавить').click();
      cy.get(`[data-testid="ingredient-${main.type}"]`).contains('Добавить').click();
      cy.get(`[data-testid="ingredient-${sauce.type}"]`).contains('Добавить').click();


      cy.get(SELECTORS.CONSTRUCTOR.BUN).should('contain.text', bun.name);
      cy.get(SELECTORS.CONSTRUCTOR.INGREDIENT).should('have.length', 2);
    });


    cy.get(SELECTORS.ORDER_BUTTON).click();


    cy.wait('@createOrder');


    cy.get('h2.text_type_digits-large').should('contain.text', '12345');
    cy.get(SELECTORS.MODAL.CLOSE).click();
    cy.get(SELECTORS.MODAL.CONTENT).should('not.exist');


    cy.get(SELECTORS.CONSTRUCTOR.BUN).should('not.exist');
    cy.get(SELECTORS.CONSTRUCTOR.INGREDIENT).should('not.exist');
  });
});