describe("Tests cases for about page", () => {

  beforeEach(() => {
    cy.login()
  })

  it("should open about page ", () => {
    cy
    .openMenu()
    .get('[data-cy=aboutSettings]')
    .click()
    .urlEquals('/aboutSettings')
  })

  it("should return to account page ", () => {
    cy
    .openMenu()
    .get('[data-cy=aboutSettings]')
    .click()
    .urlEquals('/aboutSettings')
    .goBack()
    .urlEquals('/account')
  })

  it("should open terms of service", () => {
    cy
    .openMenu()
    .get('[data-cy=aboutSettings]')
    .click()
    .get('[data-cy=terms]')
    .click()
    .urlEquals('/termsOfService')
  })

  it("should open privacy policy", () => {
    cy
    .openMenu()
    .get('[data-cy=aboutSettings]')
    .click()
    .get('[data-cy=privacy]')
    .click()
    .urlEquals('/privacyPolicy')
  })
})