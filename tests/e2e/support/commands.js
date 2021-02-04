import '../../../src/lib/initPolyfills';
import uuid from 'uuid';
import { formatDate, getLoginState } from '../../../src/popup/utils';

Cypress.Commands.add('openPopup', (onBeforeLoad, route) => {
  cy.visit(`chrome/popup/popup${route ? `#${route}` : ''}`, { onBeforeLoad });
});

Cypress.Commands.add('openAex2Popup', (type, txType) => {
  const id = uuid();
  const params = `?id=${id}&type=${type}`;
  const onBeforeLoad = async () => {
    if (txType) await browser.storage.local.set({ txType });
  };
  cy.visit(`chrome/popup/popup${params}`, { onBeforeLoad })
    .get('[data-cy=popup-aex2]')
    .should('exist')
    .should('be.visible');
});

Cypress.Commands.add('openAepp', (onBeforeLoad) => {
  cy.visit('aepp/aepp', { onBeforeLoad })
    .get('[data-cy=wallet-found]')
    .should('be.visible')
    .get('[data-cy=wallet-info]')
    .should('be.visible');
});

Cypress.Commands.add('termsAgree', () => {
  cy.get('[data-cy=checkbox]').click();
});

Cypress.Commands.add('openGenerateWallet', () => {
  cy.termsAgree().get('[data-cy=generate-wallet]').click();
});

Cypress.Commands.add('openImportWallet', () => {
  cy.termsAgree().get('[data-cy=import-wallet]').click();
});

Cypress.Commands.add('openTerms', () => {
  cy.get('[data-cy=terms]').should('be.visible').click();
});

Cypress.Commands.add('enterSeedPhrase', (seed) => {
  cy.get('textarea').clear().type(seed).get('[data-cy=import]').click();
});

Cypress.Commands.add('openAndEnterSeedPhrase', (seed) => {
  cy.openImportWallet().enterSeedPhrase(seed);
});

Cypress.Commands.add('inputShouldHaveError', (input) => {
  cy.get(input).should('have.class', 'has-error');
});

Cypress.Commands.add('buttonShouldBeDisabled', (button) => {
  cy.get(button).should('have.class', 'disabled');
});

Cypress.Commands.add('buttonShouldNotBeDisabled', (button) => {
  cy.get(button).should('not.have.class', 'disabled');
});

Cypress.Commands.add('shouldHasErrorMessage', (el) => {
  cy.get(el).should('exist').should('be.visible');
});

Cypress.Commands.add('onboardingSlideShouldBeActive', (slide) => {
  cy.get('[data-cy=onboarding-steps]').find('ul li').eq(slide).should('have.class', 'current');
});

Cypress.Commands.add('clickDotNavigationMakeSlideActive', (slide) => {
  cy.get('[data-cy=onboarding-steps]')
    .find('ul li')
    .eq(slide)
    .click()
    .onboardingSlideShouldBeActive(slide);
});

Cypress.Commands.add('toggleAccordionItem', (item) => {
  cy.get('[data-cy=accordion-item]').eq(item).click();
});

Cypress.Commands.add('accordionItemShould', (item, cond) => {
  cy.get('[data-cy=accordion-item-content]')
    .eq(item)
    .should(cond)
    .get('[data-cy=accordion-item]')
    .eq(item)
    .find('[data-cy=accordion-item-open]')
    .should(cond === 'not.be.visible' ? 'not.exist' : cond);
});

Cypress.Commands.add('login', (options = {}, route) => {
  cy.openPopup(async (contentWindow) => {
    /* eslint-disable-next-line no-param-reassign */
    contentWindow.localStorage.state = JSON.stringify(await getLoginState(options));
  }, route);
});

Cypress.Commands.add('logout', () => {
  cy.openPopup(() => localStorage.clear());
});

Cypress.Commands.add('shouldRedirect', (url, to) => {
  cy.visit(`chrome/popup/popup#${url}`)
    .url()
    .should('eq', `${Cypress.config().popupUrl}/popup#${to}`);
});

Cypress.Commands.add('openMenu', () => {
  cy.get('[data-cy=hamburger]', { timeout: 10000 }).click();
});

Cypress.Commands.add('closeMenu', (from = 'button') => {
  if (from === 'button') {
    cy.get('[data-cy=close-menu]').should('be.visible').click();
  } else if (from === 'overlay') {
    cy.get('[data-cy=menu-overlay]').should('be.visible').click('left');
  }
});

Cypress.Commands.add('menuShould', (cond) => {
  cy.get('[data-cy=sidebar-menu]').should(cond).get('[data-cy=close-menu]').should(cond);
});

Cypress.Commands.add('openMenuPage', (page, dropdown = false) => {
  let url = `${Cypress.config().popupUrl}/popup#/`;
  cy.openMenu();
  if (dropdown) {
    url += 'settings/';
    cy.toggleDropdown();
  }
  cy.get(`[data-cy=${page}]`).click().url().should('eq', `${url}${page}`).menuShould('not.exist');
});

Cypress.Commands.add('toggleDropdown', () => {
  cy.get('[data-cy=settings]').click().get('[data-cy=dropdown]');
});

Cypress.Commands.add('dropdownShould', (cond) => {
  cy.get('[data-cy=dropdown]').should(cond);
});

Cypress.Commands.add('openTip', () => {
  cy.get('[data-cy=tip-button]')
    .should('be.visible')
    .click()
    .get('[data-cy=tip-container]')
    .should('be.visible');
});

Cypress.Commands.add('openWithdraw', () => {
  cy.get('[data-cy=hamburger]').click().menuShould('be.visible').get('[data-cy=send]').click();
});

Cypress.Commands.add('enterTipDetails', ({ url = '', amount = null, note = '' }) => {
  cy.get('[data-cy=input-number]').clear();
  if (amount || amount === 0) {
    cy.get('[data-cy=input-number]').type(amount);
  }

  cy.get('[data-cy=textarea]').clear();
  if (note) cy.get('[data-cy=textarea]').type(note);

  if (url) {
    cy.get('[data-cy=input-text]').clear().type(url);
  }
});

Cypress.Commands.add('toConfirmTip', (tip = {}) => {
  if (!tip.onTip) cy.openTip();
  cy.enterTipDetails({ ...tip })
    .buttonShouldNotBeDisabled('[data-cy=send-tip]')
    .get('[data-cy=send-tip]')
    .click()
    .get('.modal .container')
    .should('be.visible')
    .get('[data-cy=to-confirm]')
    .should('be.visible')
    .click()
    .get('[data-cy=confirm-tip]')
    .should('be.visible')
    .buttonShouldNotBeDisabled('[data-cy=confirm-tip]')
    .get('[data-cy=tip-amount]')
    .should('contain', tip.amount)
    .get('[data-cy=tip-url]')
    .should('contain', tip.url)
    .get('[data-cy=tip-note]')
    .should('contain', tip.note);
});

Cypress.Commands.add('sendTip', (tip = {}) => {
  cy.toConfirmTip({ ...tip })
    .get('[data-cy=confirm-tip]')
    .click()
    .get('[data-cy=balance-info]')
    .should('be.visible')
    .url()
    .should('eq', `${Cypress.config().popupUrl}/popup#/account`)
    .get('[data-cy=pending-txs]')
    .should('be.visible')
    .get('[data-cy=success-tip]', { timeout: 240000 })
    .should('be.visible')
    .url()
    .should('eq', `${Cypress.config().popupUrl}/popup#/success-tip`)
    .get('[data-cy=tip-amount]')
    .should('contain', tip.amount)
    .get('[data-cy=tip-url]')
    .should('contain', tip.url);
});

Cypress.Commands.add('pendingTx', (tx = {}) => {
  cy.pendingTxItem().then((txItem) => {
    txItem.find('[data-cy=amount]').should('contain', tx.amount);
    txItem.find('[data-cy=status]').should('contain', 'Pending');
    if (tx.url) txItem.find('[data-cy=url]').should('contain', tx.url);
    if (tx.time) txItem.find('[data-cy=time]').should('contain', formatDate(tx.time));
  });
});

Cypress.Commands.add('enterAmountSend', (amount = 0) => {
  cy.get('[data-cy=input-number]').clear().type(amount);
});

Cypress.Commands.add('goBack', () => {
  cy.get('[data-cy=back-arrow]').click();
});

Cypress.Commands.add('enterAddress', (address) => {
  cy.get('[data-cy=address]').clear().type(address);
});

Cypress.Commands.add(
  'storageSet',
  (key, value) =>
    new Cypress.Promise(async (resolve) => {
      await browser.storage.local.set({ [key]: value });
      resolve();
    }),
);

Cypress.Commands.add('urlEquals', (route) => {
  cy.url().should('eq', `${Cypress.config().popupUrl}/popup#${route}`);
});

Cypress.Commands.add('openNetworks', () => {
  cy.openMenu().toggleDropdown().get('[data-cy=networks]').click().urlEquals('/settings/networks');
});

Cypress.Commands.add('enterNetworkDetails', (network, url, middleware, compiler) => {
  cy.get('[data-cy=network] input')
    .clear()
    .type(network)
    .get('[data-cy=url] input')
    .clear()
    .type(url)
    .get('[data-cy=middleware] input')
    .clear()
    .type(middleware)
    .get('[data-cy=compiler] input')
    .clear()
    .type(compiler);
});

Cypress.Commands.add('addNetwork', (network, url, middleware, compiler) => {
  cy.get('[data-cy=to-add]')
    .click()
    .get('[data-cy=connect]')
    .should('be.visible')
    .buttonShouldBeDisabled('[data-cy=connect]')
    .enterNetworkDetails(network, url, middleware, compiler)
    .get('[data-cy=connect]')
    .click()
    .get('[data-cy=networks]')
    .should('be.visible')
    .get('[data-cy=network-name]')
    .should('contain', network)
    .get('[data-cy=network-url]')
    .should('contain', url)
    .get('[data-cy=network-middleware]')
    .should('contain', middleware);
});

Cypress.Commands.add('selectNetwork', () => {
  cy.get('[data-cy=networks] .network-row')
    .eq(1)
    .find('.checkmark')
    .click()
    .should('have.class', 'checked');
});

Cypress.Commands.add('openTransactions', () => {
  cy.get('[data-cy=view-all-transactions]')
    .click()
    .get('[data-cy=loader]')
    .should('be.visible')
    .get('[data-cy=all-transactions]')
    .should('be.visible')
    .get('[data-cy=filters]')
    .should('be.visible');
});
