import { PROTOCOLS } from '@/constants';
import { STUB_ACCOUNT } from '@/constants/stubs';

const {
  DOWN, ENTER, ESC, SPACE,
} = Cypress.Keyboard.Keys;

const CONTACT = {
  name: 'Keyboard contact',
  address: 'ak_wMHNCzQJ4HUL3TZ1fi6nQsHg6TjmHLs1bPXSp8iQ1VmxGNAZ4',
  isBookmarked: false,
  protocol: PROTOCOLS.aeternity,
};

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
    cy.get('.account-select-btn').should('be.visible');
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

/**
 * `cy.press` sends native key events. In Chromium its Enter has no character,
 * which a native button needs to activate, so native buttons get Space here.
 */
describe('Keyboard operation', () => {
  function typeContactName() {
    cy.login({ addressBook: [CONTACT] });
    cy.openSendModal();
    cy.get('[data-cy=address] [data-cy=textarea]').type('Keyb');
    cy.get('[data-cy=address] .dropdown-wrapper').should('have.class', 'open');
  }

  it('opens and closes an accordion item from the keyboard', () => {
    cy.login({}, '/more/about/terms');
    cy.get('[data-cy=accordion-item-label]:visible').first().focus();

    cy.press(SPACE);
    cy.focused().should('have.attr', 'aria-expanded', 'true');
    cy.get('[data-cy=accordion-item-content]').should('have.length', 1);

    cy.press(SPACE);
    cy.focused().should('have.attr', 'aria-expanded', 'false');
    cy.get('[data-cy=accordion-item-content]').should('not.exist');
  });

  it('picks an address book suggestion with the arrow keys', () => {
    typeContactName();

    cy.press(DOWN);
    cy.focused().should('have.attr', 'data-cy', 'address-suggestion');
    cy.press(SPACE);

    // The æternity form takes several recipients, so the field stays for the next one
    cy.get('[data-cy=address] .selected-address-container')
      .should('have.length', 1)
      .find('.address-chunk')
      .first()
      .should(($chunk) => {
        expect($chunk.text().trim()).to.have.length.greaterThan(3);
        expect(CONTACT.address.startsWith($chunk.text().trim())).to.eq(true);
      });
    cy.get('[data-cy=address] .dropdown-wrapper').should('not.have.class', 'open');
    cy.focused().should('have.attr', 'data-cy', 'textarea').and('have.value', '');
  });

  it('closes the suggestions first, then the send modal, with Escape', () => {
    typeContactName();

    cy.press(ESC);
    cy.get('[data-cy=address] .dropdown-wrapper').should('not.have.class', 'open');
    // Let a wrongly handled Escape close the modal before checking that it stayed
    cy.wait(500);
    cy.get('[data-cy=address] [data-cy=textarea]').should('exist');

    cy.press(ESC);
    cy.get('[data-cy=address]').should('not.exist');
    // Back on the button that opened the modal
    cy.focused().should('have.attr', 'data-cy', 'send');
  });

  it('moves the focus into the send modal it opens', () => {
    cy.login();
    cy.get('[data-cy=send]').focus();

    cy.press(SPACE);
    cy.focused().should('have.attr', 'role', 'dialog');
    cy.get('[data-cy=address]').should('exist');
  });

  it('copies the account address with Enter', () => {
    cy.login({}, '/account-details');
    cy.get('.account-address[role=button]:visible').focus();

    cy.press(ENTER);

    cy.get('.account-address .copied:visible').should('exist');
    cy.window()
      .its('navigator.clipboard')
      .then(async (clipboard) => {
        expect(await clipboard.readText()).to.eq(STUB_ACCOUNT.addressAeternity);
      });
  });
});
