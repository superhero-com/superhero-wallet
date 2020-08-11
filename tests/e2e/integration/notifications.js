describe('Tests cases for notifications page and icon', () => {
  beforeEach(() => {
    cy.logout().openPopup();
  });

  it('Have and click notification icon, open notifications page and return', () => {
    cy.login()
      .get('[data-cy=noti-count]')
      .should('be.visible')
      .should('contain', 1)
      .get('[data-cy=noti]')
      .click()
      .urlEquals('/notifications')

      .goBack()
      .urlEquals('/account');
  });

  it("Don't have backup seed notification", () => {
    cy.login({ backedUpSeed: true })
      .get('[data-cy=noti-count]')
      .should('be.not.visible');
  });
});
