const links = ['receive', 'send', 'transactions', 'names', 'about'];

const dropdownLinks = ['security', 'language', 'networks'];

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
      .get('.avatar')
      .should('be.visible')

      .toggleDropdown()
      .dropdownShould('be.visible')
      .toggleDropdown()
      .dropdownShould('not.exist')

      .get('[data-cy=chain-name]')
      .should('not.exist')

      .closeMenu()
      .menuShould('not.exist')

      .openMenu()
      .menuShould('be.visible')
      .wrap(links)
      .each((link) => {
        cy.get(`[data-cy=${link}]`).should('have.attr', 'href').and('include', `/${link}`);
      });

    cy.closeMenu('overlay').menuShould('not.exist');
  });

  it(`Opens each non-dropdown page and returns to account page`, () => {
    links.forEach((page) => {
      cy.openMenuPage(page)
        .get('[data-cy=back-arrow]')
        .should('be.visible')
        .click()
        .get('[data-cy=balance-info]')
        .should('be.visible')
        .get('[data-cy=back-arrow]')
        .should('not.exist');
    });
  });

  it(`Opens each dropdown page and returns to settings page`, () => {
    dropdownLinks.forEach((page) => {
      cy.openMenuPage(page, true)
        .get('[data-cy=back-arrow]')
        .should('be.visible')
        .click()
        .url()
        .should('contain', '/settings')
        .get('[data-cy=back-arrow]')
        .should('be.visible');
    });
  });
});
