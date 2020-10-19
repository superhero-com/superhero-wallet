const links = ['receive', 'send', 'transactions', 'names', 'aboutSettings'];

const dropdownLinks = ['securitySettings', 'generalSettings', 'networks'];

describe('Test cases for menu sidebar component', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Menu open button is visible when authenticated', () => {
    cy.get('[data-cy=hamburger]').should('be.visible');
  });

  it('Identicon is shown, menu is closing, links have correct href, do not have chain name, toggle dropdown', () => {
    cy.openMenu()
      .menuShould('be.visible')
      .get('.user-avatar')
      .should('be.visible')

      .toggleDropdown()
      .dropdownShould('be.visible')
      .toggleDropdown()
      .dropdownShould('not.be.visible')

      .get('[data-cy=chain-name]')
      .should('not.exist')

      .closeMenu()
      .menuShould('not.be.visible')

      .openMenu()
      .menuShould('be.visible')
      .wrap(links)
      .each(link => {
        cy.get(`[data-cy=${link}]`)
          .should('have.attr', 'href')
          .and('include', `/${link}`);
      });

    cy.closeMenu('overlay').menuShould('not.be.visible');
  });

  [...links, ...dropdownLinks].forEach(page => {
    it(`Open ${page} page and return to account page`, () => {
      cy.openMenuPage(page, dropdownLinks.includes(page))
        .get('[data-cy=back-arrow]')
        .should('be.visible')
        .click()
        .get('[data-cy=balance-info]')
        .should('be.visible')
        .get('[data-cy=back-arrow]')
        .should('not.be.visible');
    });
  });
});
