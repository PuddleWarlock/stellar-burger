
/// <reference types="cypress" />

import { SELECTORS } from './selectors';

Cypress.Commands.add('openIngredientModal', (ingredientName: string) => {
  cy.contains(ingredientName).click();
  cy.get(SELECTORS.MODAL.CONTENT).should('contain.text', ingredientName);
});

Cypress.Commands.add('closeModal', (method: 'close-button' | 'overlay') => {
  if (method === 'close-button') {
    cy.get(SELECTORS.MODAL.CLOSE).click();
  } else {

    cy.get(SELECTORS.MODAL.OVERLAY).click({ force: true });
  }
  cy.get(SELECTORS.MODAL.CONTENT).should('not.exist');
});


Cypress.Commands.add('setAuthTokens', () => {


  cy.setCookie('accessToken', 'Bearer fake-access-token');
  localStorage.setItem('refreshToken', 'fake-refresh-token');
});




























declare global {
  namespace Cypress {
    interface Chainable {
      openIngredientModal(ingredientName: string): Chainable<void>;
      closeModal(method: 'close-button' | 'overlay'): Chainable<void>;
      setAuthTokens(): Chainable<void>;
    }
  }
}


export {}