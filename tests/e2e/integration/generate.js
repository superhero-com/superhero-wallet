describe('Test cases for generate wallet page', () => {
  beforeEach(() => {
    cy.openPopup();
  });

  it('Open generate wallet page', () => {
    cy.openGenerateWallet()
      .get('[data-cy=onboarding-steps]')
      .should('be.visible')
      .onboardingSlideShouldBeActive(0);
  });

  it('Skip onboarding after click skip', () => {
    cy.openGenerateWallet()
      .onboardingSlideShouldBeActive(0)
      .get('[data-cy=skip]')
      .click()
      .get('[data-cy=generate-wallet]')
      .should('be.visible')
      .onboardingSlideShouldBeActive(2);
  });

  it('Next arrow should change slide', () => {
    cy.openGenerateWallet()
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
      .should('not.be.visible');
  });

  it('Prev arrow should change slide', () => {
    cy.openGenerateWallet()
      .onboardingSlideShouldBeActive(0)
      .get('[data-cy=prev]')
      .should('not.be.visible')
      .get('[data-cy=next]')
      .should('be.visible')
      .click()
      .onboardingSlideShouldBeActive(1)
      .get('[data-cy=prev]')
      .click()
      .onboardingSlideShouldBeActive(0);
  });

  it('Click prev arrow changes slide', () => {
    cy.openGenerateWallet()
      .get('[data-cy=skip]')
      .click()
      .get('[data-cy=next]')
      .should('not.be.visible')
      .get('[data-cy=prev]')
      .should('be.visible')
      .click()
      .onboardingSlideShouldBeActive(1)
      .get('[data-cy=prev]')
      .click()
      .onboardingSlideShouldBeActive(0);
  });

  it('Click dot navigation makes slide active', () => {
    cy.openGenerateWallet()
      .clickDotNavigationMakeSlideActive(1)
      .clickDotNavigationMakeSlideActive(2)
      .clickDotNavigationMakeSlideActive(0);
  });

  it('Generate wallet', () => {
    cy.openGenerateWallet()
      .get('[data-cy=skip]')
      .click()
      .get('[data-cy=generate-wallet]')
      .click()
      .get('[data-cy=proceed-to-wallet]')
      .should('be.visible')
      .get('[data-cy=hamburger')
      .should('be.visible');
  });

  it('Proceed to account after generate wallet', () => {
    cy.openGenerateWallet()
      .get('[data-cy=skip]')
      .click()
      .get('[data-cy=generate-wallet]')
      .click()
      .get('[data-cy=proceed-to-wallet]')
      .click()
      .get('[data-cy=balance-info]')
      .should('be.visible');
  });
});
