import { SELECTORS } from 'cypress/support/selectors';

describe('Ингредиент — модальное окно', () => {
  beforeEach(() => {

    cy.fixture('ingredients.json').as('ingredientsData');


    cy.intercept('GET', '**/api/ingredients', {
      fixture: 'ingredients.json'
    }).as('loadIngredients');

    cy.visit('/');
    cy.wait('@loadIngredients');
  });

  it('открывает и отображает модалку с деталями', function () {

    const ingredient = this.ingredientsData.data[0];


    cy.openIngredientModal(ingredient.name);



    cy.get(`${SELECTORS.MODAL.CONTENT} img`).should(
      'have.attr',
      'src',
      ingredient.image_large
    );
  });

  it('закрывается по клику на крестик', function () {
    const ingredient = this.ingredientsData.data[0];

    cy.openIngredientModal(ingredient.name);
    cy.closeModal('close-button');
  });

  it('закрывается по клику на оверлей', function () {
    const ingredient = this.ingredientsData.data[0];

    cy.openIngredientModal(ingredient.name);
    cy.closeModal('overlay');
  });
});
