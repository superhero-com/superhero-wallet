const legacyInviteUrl = '/invite/7heh8jzN54669JMV34vHcfp2SKJAzcAAZCe2XtC76hec2E4f6jGJtYQT8nrf52oRiGpEQ95srA5dT4DFQatRo6XrFqFXa';
const currentInviteUrl = '/invite#PZK6m94Sc5X2ibggH4sFPnG98GGdhCMzbpbHju4jSWxpoD4uB';

describe('Test cases for invite page', () => {
  it('opens the legacy and the current invite links', () => {
    cy.login({}, legacyInviteUrl)
      .get('.modal [data-cy=balance-info] .asset-fractional')
      .should('be.visible')
      .get('[data-cy=redeem-main-btn]')
      .should('be.visible');

    cy.logout();
    cy.login({}, currentInviteUrl)
      .get('.modal [data-cy=balance-info] .asset-fractional')
      .should('be.visible')
      .get('[data-cy=redeem-main-btn]')
      .should('be.visible');
  });
});
