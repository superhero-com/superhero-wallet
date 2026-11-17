import { PROTOCOLS } from '@/constants';

// axe-core runs in the app window, so it audits the app document.
function checkAccessibleNames() {
  cy.readFile('node_modules/axe-core/axe.min.js').then((axeSource) => {
    cy.window().then((win) => {
      if (!win.axe) win.eval(axeSource);
    });
  });
  cy.window()
    .then((win) => win.axe.run(win.document, { runOnly: ['button-name', 'link-name'] }))
    .then(({ violations }) => {
      const unnamed = violations.flatMap(({ id, nodes }) => nodes.map(({ html }) => `${id}: ${html}`));
      expect(unnamed).to.deep.equal([]);
    });
}

describe('Accessible names of buttons and links', () => {
  it('names the dashboard and the send modal controls', () => {
    cy.login({
      accountsRaw: Array.from({ length: 6 }, (_, idx) => ({
        idx,
        protocol: PROTOCOLS.aeternity,
        isRestored: true,
        type: 'hd-wallet',
      })),
      activeAccountGlobalIdx: 1,
    });
    cy.get('[data-cy=account-card-btn-prev]').should('be.visible');
    cy.get('.account-select-input').should('be.visible');
    checkAccessibleNames();

    cy.openSendModal();
    cy.get('[data-cy=address-book-button]').should('be.visible');
    checkAccessibleNames();
  });

  [
    ['/account-details', '[data-cy=btn-close]:visible'],
    ['/apps-browser', '.apps-browser .input-url'],
    ['/more', '[data-cy=settings]'],
    ['/more/settings', '[data-cy=networks-settings]'],
    ['/more/settings/networks', '[data-cy=networks]'],
    ['/more/address-book', '[data-cy=add-address]'],
    ['/more/address-book/add', '[data-cy=scan-button]'],
  ].forEach(([path, readySelector]) => {
    it(`names the controls on ${path}`, () => {
      cy.login({}, path);
      cy.get(readySelector).should('be.visible');
      checkAccessibleNames();
    });
  });

  it('names the welcome page controls', () => {
    cy.logout();
    cy.get('.app-unauthenticated-placeholder', { timeout: 20000 }).should('not.have.class', 'visible');
    cy.get('[data-cy=checkbox]').click();
    cy.get('[data-cy=generate-wallet]').should('be.visible');
    checkAccessibleNames();
  });
});
