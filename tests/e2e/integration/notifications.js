describe('Tests cases for notifications page and icon', () => {
  it('Notifications badge should contain number of notifications', () => {
    cy.login({ network: 'Mainnet' })
      .get('[data-cy=notifications-btn]')
      .find('[data-cy=badge-text]')
      .should('be.visible')
      .should('contain', 1);
  });

  it('Notifications icon should navigate to the notifications list', () => {
    cy.login({ network: 'Mainnet' })
      .get('[data-cy=notifications-btn]')
      .click()
      .urlEquals('/notifications');
  });

  it('Do not have backup seed notification', () => {
    cy.login({ isSeedBackedUp: true, network: 'Mainnet' })
      .get('[data-cy=notifications-btn]')
      .find('[data-cy=badge-text]')
      .should('not.exist');
  });
});
