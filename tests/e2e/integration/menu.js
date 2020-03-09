const links = [
  'receive',
  'send',
  'transactions',
  'names',
  'aboutSettings'
]

describe("Test cases for menu sidebar component", () => {
  beforeEach(() => {
    cy.login()
  })

  it("menu open button should be visible when authenticated", () => {
    cy
    .get('[data-cy=hamburger]')
    .should('be.visible')
  })

  it("should open menu when click hamburger", () => {
    cy
    .openMenu()
    .menuShould('be.visible')
  })

  it("should close menu when click close button", () => {
    cy
    .openMenu()
    .menuShould('be.visible')
    .closeMenu()
    .menuShould('not.be.visible')
  })

  it("should close menu when click on overlay", () => {
    cy
    .openMenu()
    .menuShould('be.visible')
    .closeMenu('overlay')
    .menuShould('not.be.visible')
  })

  it("should have account identicon", () => {
    cy
    .openMenu()
    .get('.account-icon')
    .should('be.visible')
  })
  
  it("menu links should have correct href", () => {

    cy
    .openMenu()
    .wrap(links).each((link,i,array) => {
      cy
      .get(`[data-cy=${link}]`)
      .should('have.attr','href')
      .and('include',`/${link}`)
    })
  })

  links.forEach((page) => {
    it(`should open ${page} page`, () => {
      cy
      .openMenuPage(page)
    })
  })

  
})