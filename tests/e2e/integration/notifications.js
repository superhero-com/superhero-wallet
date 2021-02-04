describe('Tests cases for notifications page and icon', () => {
  it('Have and click notification icon, open notifications page and return', () => {
    cy.login({ network: 'Mainnet' })
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
    cy.login({ backedUpSeed: true, network: 'Mainnet' })
      .get('[data-cy=noti-count]')
      .should('not.exist');
  });
});
