describe('Редактирование профиля пользователя', () => {
  const initialUser = { name: 'Initial Name', email: 'initial@example.com' };
  const updatedUser = {
    name: 'Updated Name',
    email: 'updated@example.com',
    password: 'newpassword'
  };

  beforeEach(() => {
    cy.intercept('GET', '/api/auth/user', {
      success: true,
      user: initialUser
    }).as('getUser');
    cy.intercept('PATCH', '/api/auth/user', {
      success: true,
      user: { name: updatedUser.name, email: updatedUser.email }
    }).as('updateUser');
    cy.intercept('POST', '/api/auth/logout', {
      success: true,
      message: 'successful logout'
    }).as('logout');
    cy.intercept('GET', '**/api/ingredients', {
      fixture: 'ingredients.json'
    }).as('loadIngredients');

    cy.setAuthTokens();
    cy.visit('/profile');
    cy.wait('@loadIngredients');
    cy.wait('@getUser');
  });

  it('Отображает текущие данные пользователя в полях формы', () => {
    cy.get('input[name="name"]').should('have.value', initialUser.name);
    cy.get('input[name="email"]').should('have.value', initialUser.email);
    cy.get('input[name="password"]').should('have.value', '');
  });

  it('Кнопки "Отменить" и "Сохранить" появляются при изменении формы', () => {
    cy.contains('Отменить').should('not.exist');
    cy.contains('Сохранить').should('not.exist');

    cy.get('input[name="name"]').type(' changed');

    cy.contains('Отменить').should('exist');
    cy.contains('Сохранить').should('exist');
  });

  it('При нажатии "Отменить" изменения формы сбрасываются', () => {
    cy.get('input[name="name"]').type(' changed');
    cy.get('input[name="email"]').clear().type('changed@example.com');
    cy.get('input[name="password"]').type('somepassword');

    cy.contains('Отменить').click();

    cy.get('input[name="name"]').should('have.value', initialUser.name);
    cy.get('input[name="email"]').should('have.value', initialUser.email);
    cy.get('input[name="password"]').should('have.value', '');

    cy.contains('Отменить').should('not.exist');
    cy.contains('Сохранить').should('not.exist');
  });

  it('Успешное обновление имени и email', () => {
    cy.get('input[name="name"]').clear().type(updatedUser.name);
    cy.get('input[name="email"]').clear().type(updatedUser.email);

    cy.contains('Сохранить').click();
    cy.wait('@updateUser').its('request.body').should('deep.equal', {
      name: updatedUser.name,
      email: updatedUser.email
    });

    cy.contains('Отменить').should('not.exist');
    cy.contains('Сохранить').should('not.exist');

    cy.get('input[name="name"]').should('have.value', updatedUser.name);
    cy.get('input[name="email"]').should('have.value', updatedUser.email);
    cy.get('input[name="password"]').should('have.value', '');
  });

  it('Успешное обновление пароля приводит к логауту', () => {
    cy.get('input[name="password"]').type(updatedUser.password);
    cy.contains('Сохранить').click();
    cy.wait('@updateUser').its('request.body').should('deep.equal', {
      name: initialUser.name,
      email: initialUser.email,
      password: updatedUser.password
    });
    cy.wait('@logout');
    cy.url().should('include', '/login');
  });

  it('Ошибка обновления профиля', () => {
    cy.intercept('PATCH', '/api/auth/user', {
      statusCode: 400,
      body: { success: false, message: 'Update failed' }
    }).as('updateUserFailed');

    cy.get('input[name="name"]').type(' changed');
    cy.contains('Сохранить').click();

    cy.wait('@updateUserFailed');
    cy.contains('Update failed').should('exist');

    cy.contains('Отменить').should('exist');
    cy.contains('Сохранить').should('exist');
  });
});
