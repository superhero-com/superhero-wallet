const links = ['receive', 'send', 'transactions', 'names', 'aboutSettings'];

const dropdownLinks = ['securitySettings', 'generalSettings'];

describe('Test cases for menu sidebar component', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Menu open button is visible when authenticated', () => {
    cy.get('[data-cy=hamburger]').should('be.visible');
  });

  it('Open menu when click hamburger', () => {
    cy.openMenu().menuShould('be.visible');
  });

  it('Close menu when click close button', () => {
    cy.openMenu()
      .menuShould('be.visible')
      .closeMenu()
      .menuShould('not.be.visible');
  });

  it('Close menu when click on overlay', () => {
    cy.openMenu()
      .menuShould('be.visible')
      .closeMenu('overlay')
      .menuShould('not.be.visible');
  });

  it('Have account identicon', () => {
    cy.openMenu()
      .get('.user-avatar')
      .should('be.visible');
  });

  it('Menu links have correct href', () => {
    cy.openMenu()
      .wrap(links)
      .each(link => {
        cy.get(`[data-cy=${link}]`)
          .should('have.attr', 'href')
          .and('include', `/${link}`);
      });
  });

  links.forEach(page => {
    it(`Open ${page} page`, () => {
      cy.openMenuPage(page);
    });
  });

  links.forEach(page => {
    it(`Open ${page} page and return to account page`, () => {
      cy.openMenuPage(page)
        .get('[data-cy=back-arrow]')
        .should('be.visible')
        .click()
        .get('[data-cy=balance-info]')
        .should('be.visible')
        .get('[data-cy=back-arrow]')
        .should('not.be.visible');
    });
  });

  it('Open dropdown', () => {
    cy.openMenu()
      .toggleDropdown()
      .dropdownShould('be.visible')
      .toggleDropdown()
      .dropdownShould('not.be.visible');
  });

  dropdownLinks.forEach(page => {
    it(`Open ${page} dropdown page`, () => {
      cy.openMenuPage(page, true);
    });
  });

  dropdownLinks.forEach(page => {
    it(`Open ${page} dropdown page and return to account page`, () => {
      cy.openMenuPage(page, true)
        .get('[data-cy=back-arrow]')
        .should('be.visible')
        .click()
        .get('[data-cy=balance-info]')
        .should('be.visible')
        .get('[data-cy=back-arrow]')
        .should('not.be.visible');
    });
  });

  it("Don't have chain name", () => {
    cy.openMenu()
      .get('[data-cy=chain-name]')
      .should('not.exist');
  });
});
