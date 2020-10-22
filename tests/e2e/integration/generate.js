describe('Test cases for generate wallet page', () => {
  it('Opens generate page, clicks prev, next, skip, dot buttons, generates wallet and proceeds to account', () => {
    cy.logout()
      .openPopup()
      .openGenerateWallet()
      .get('[data-cy=onboarding-steps]')
      .should('be.visible')
      .onboardingSlideShouldBeActive(0)
      .get('[data-cy=skip]')
      .click()
      .get('[data-cy=generate-wallet]')
      .should('be.visible')
      .onboardingSlideShouldBeActive(2)

      .get('[data-cy=prev]')
      .should('be.visible')
      .click()
      .onboardingSlideShouldBeActive(1)
      .get('[data-cy=prev]')
      .click()
      .onboardingSlideShouldBeActive(0)
      .get('[data-cy=prev]')
      .should('not.be.visible')

      .onboardingSlideShouldBeActive(0)
      .get('[data-cy=next]')
      .click()
      .onboardingSlideShouldBeActive(1)
      .get('[data-cy=next]')
      .click()
      .onboardingSlideShouldBeActive(2)
      .get('[data-cy=generate-wallet]')
      .should('be.visible')
      .get('[data-cy=next]')
      .should('not.be.visible')

      .clickDotNavigationMakeSlideActive(0)
      .clickDotNavigationMakeSlideActive(1)
      .clickDotNavigationMakeSlideActive(2)

      .get('[data-cy=generate-wallet]')
      .click()
      .get('[data-cy=hamburger')
      .should('be.visible')
      .get('[data-cy=proceed-to-wallet]')
      .should('be.visible')

      .click()
      .get('[data-cy=balance-info]')
      .should('be.visible');
  });
});
