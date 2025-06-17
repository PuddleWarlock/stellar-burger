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

  it('показывает ингредиенты и добавляет булку и начинку по трехшаговому правилу', function () {
    const ingredients = this.ingredientsData.data;
    const bun = ingredients.find((i: any) => i.type === 'bun');
    const main = ingredients.find((i: any) => i.type === 'main');

    expect(bun).to.not.be.undefined;
    expect(main).to.not.be.undefined;

    cy.get(SELECTORS.CONSTRUCTOR.BUN).should('not.exist');
    cy.contains('Выберите булки').should('exist');

    cy.get(`[data-testid="ingredient-${bun.type}"]`)
      .contains('Добавить')
      .click();

    cy.get(SELECTORS.CONSTRUCTOR.BUN).should('have.length', 2);
    cy.get(SELECTORS.CONSTRUCTOR.BUN)
      .first()
      .should('contain.text', `${bun.name} (верх)`);
    cy.get(SELECTORS.CONSTRUCTOR.BUN)
      .last()
      .should('contain.text', `${bun.name} (низ)`);
    cy.contains('Выберите булки').should('not.exist');

    cy.get(SELECTORS.CONSTRUCTOR.INGREDIENT).should('not.exist');
    cy.contains('Выберите начинку').should('exist');

    cy.get(`[data-testid="ingredient-${main.type}"]`)
      .contains('Добавить')
      .click();

    cy.get(SELECTORS.CONSTRUCTOR.INGREDIENT).should('have.length', 1);
    cy.get(SELECTORS.CONSTRUCTOR.INGREDIENT)
      .first()
      .should('contain.text', main.name);
    cy.contains('Выберите начинку').should('not.exist');
  });
});
