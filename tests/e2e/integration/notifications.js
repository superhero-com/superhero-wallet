describe('Tests cases for notifications page and icon', () => {
  it('Have backup seed notification', () => {
    cy.login()
      .get('[data-cy=noti-count]')
      .should('be.visible')
      .should('contain', 1);
  });

  it('Click notification icon open notifications page', () => {
    cy.login()
      .get('[data-cy=noti-count]')
      .should('contain', 1)
      .get('[data-cy=noti]')
      .click()
      .urlEquals('/notifications');
  });

  it('Return to account from notifications', () => {
    cy.login()
      .get('[data-cy=noti-count]')
      .should('contain', 1)
      .get('[data-cy=noti]')
      .click()
      .urlEquals('/notifications')
      .goBack()
      .urlEquals('/account');
  });

  it("Don't have backup seed notification", () => {
    cy.login({ backupSeed: true })
      .get('[data-cy=noti-count]')
      .should('be.not.visible');
  });

  it("Click notification icon don't open notifications page", () => {
    cy.login({ backupSeed: true })
      .get('[data-cy=noti]')
      .click()
      .urlEquals('/account');
  });
});
