

import { SELECTORS } from 'cypress/support/selectors';

describe('Конструктор бургера — базовое взаимодействие', () => {
  beforeEach(() => {

    cy.fixture('ingredients.json').as('ingredientsData');



    cy.intercept('GET', '**/api/ingredients', {
      fixture: 'ingredients.json'
    }).as('loadIngredients');

    cy.visit('/');
    cy.wait('@loadIngredients');
  });


  it('показывает ингредиенты и добавляет булку и начинку', function () {


    const ingredients = this.ingredientsData.data;

    const bun = ingredients.find((i: any) => i.type === 'bun');
    const main = ingredients.find((i: any) => i.type === 'main');


    expect(bun).to.not.be.undefined;
    expect(main).to.not.be.undefined;




    cy.get(`[data-testid="ingredient-${bun.type}"]`).contains('Добавить').click();
    cy.get(`[data-testid="ingredient-${main.type}"]`).contains('Добавить').click();


    cy.get(SELECTORS.CONSTRUCTOR.BUN).should('contain.text', bun.name);
    cy.get(SELECTORS.CONSTRUCTOR.INGREDIENT).should('contain.text', main.name);


    cy.contains(`${bun.name} (верх)`).should('exist');
    cy.contains(`${bun.name} (низ)`).should('exist');
  });
});