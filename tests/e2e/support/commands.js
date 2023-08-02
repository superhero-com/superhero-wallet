import '../../../src/lib/initPolyfills';
import { v4 as uuid } from 'uuid';
import { mnemonicToSeed } from '@aeternity/bip39';
import { ROUTE_ACCOUNT_DETAILS_TRANSACTIONS } from '../../../src/popup/router/routeNames';
import { STUB_CURRENCY, STUB_ACCOUNT } from '../../../src/config/stubs';
import {
  formatDate,
  formatTime,
} from '../../../src/utils';
import {
  LOCAL_STORAGE_PREFIX,
  TRANSACTIONS_LOCAL_STORAGE_KEY,
} from '../../../src/popup/utils';
import {
  AE_NETWORK_MAINNET_ID,
} from '../../../src/protocols/aeternity/config';
import { CoinGecko } from '../../../src/lib/CoinGecko';
import runMigrations from '../../../src/store/migrations';

export async function getLoginState({
  backedUpSeed,
  balance,
  name,
  network,
}) {
  const { mnemonic, address } = STUB_ACCOUNT;
  const account = {
    address,
    privateKey: mnemonicToSeed(mnemonic).toString('hex'),
  };
  return {
    ...(await runMigrations()),
    account,
    mnemonic,
    backedUpSeed,
    current: { network: network || 'Testnet' },
    balance,
    ...(name && { names: { defaults: { [`${account.address}-${AE_NETWORK_MAINNET_ID}`]: name } } }),
  };
}

export function preparePendingTransactionToLocalStorage(pendingTransaction) {
  const { address } = testAccount;

  return {
    [address]: { loaded: [], pending: { [AE_NETWORK_MAINNET_ID]: [pendingTransaction] } },
  };
}

Cypress.Commands.add('getByTestId', (testId) => {
  cy.get(`[data-cy=${testId}]`);
});

Cypress.Commands.add('getInputByTestId', (testId) => {
  cy.getByTestId(testId).find('input');
});

Cypress.Commands.add('openPopup', (onBeforeLoad, route) => {
  cy.visit(route || '', { onBeforeLoad });
});

Cypress.Commands.add('openAex2Popup', (type, txType) => {
  const id = uuid();
  const params = `?id=${id}&type=${type}`;
  const onBeforeLoad = () => (txType ? browser.storage.local.set({ txType }) : browser.storage.local.remove('txType'));
  cy.visit(`${params}`, { onBeforeLoad })
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

Cypress.Commands.add('inputShouldHaveError', (input) => {
  cy.get(input).should('have.class', 'error');
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

Cypress.Commands.add('mockExternalRequests', () => {
  cy.stub(CoinGecko, 'fetchCoinMarketData', STUB_CURRENCY);
  cy.stub(CoinGecko, 'fetchCoinCurrencyRates', { usd: 0.05 });
});

Cypress.Commands.add('login', (options = {}, route, isMockingExternalRequests = true) => {
  if (isMockingExternalRequests) cy.mockExternalRequests();
  cy.openPopup(async (contentWindow) => {
    /* eslint-disable-next-line no-param-reassign */
    contentWindow.localStorage.state = JSON.stringify(await getLoginState(options));

    if (options.pendingTransaction) {
      const localStorageKey = [
        LOCAL_STORAGE_PREFIX,
        TRANSACTIONS_LOCAL_STORAGE_KEY,
        AE_NETWORK_MAINNET_ID,
      ].join('_');

      // eslint-disable-next-line no-param-reassign
      contentWindow.localStorage[localStorageKey] = JSON.stringify(
        preparePendingTransactionToLocalStorage(options.pendingTransaction),
      );
    }
  }, route);
});

Cypress.Commands.add('logout', () => {
  cy.openPopup(() => localStorage.clear());
});

Cypress.Commands.add('shouldRedirect', (url, to) => {
  cy.visit(`${url}`).urlEquals(to);
});

Cypress.Commands.add('openPageMore', () => {
  cy.get('[data-cy=page-more]')
    .should('be.visible')
    .click();
});

Cypress.Commands.add('openTip', () => {
  cy.visit('/more/tips')
    .get('[data-cy=tip-container]')
    .should('be.visible');
});

Cypress.Commands.add('openWithdraw', () => {
  cy.get('[data-cy=send]').click();
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
    .urlEquals('account')
    .get('[data-cy=pending-txs]')
    .should('be.visible')
    .get('[data-cy=success-tip]', { timeout: 240000 })
    .should('be.visible')
    .urlEquals('success-tip')
    .get('[data-cy=tip-amount]')
    .should('contain', tip.amount)
    .get('[data-cy=tip-url]')
    .should('contain', tip.url);
});

Cypress.Commands.add('pendingTx', (tx = {}) => {
  cy.pendingTxItem().should((txItem) => {
    txItem.find('[data-cy=amount]').should('contain', tx.amount);
    txItem.find('[data-cy=status]').should('contain', 'Pending');
    if (tx.url) txItem.find('[data-cy=url]').should('contain', tx.url);
    if (tx.time) {
      txItem.find('[data-cy=date]').should('contain', formatDate(tx.time));
      txItem.find('[data-cy=time]').should('contain', formatTime(tx.time));
    }
  });
});

Cypress.Commands.add('enterInputAmount', (amount = 0) => {
  cy.get('[data-cy=amount] [data-cy=input]').clear().type(amount);
});

Cypress.Commands.add('goBack', () => {
  cy.get('[data-cy=back-arrow]').click();
});

Cypress.Commands.add('enterAddress', (address) => {
  cy.get('[data-cy=address] [data-cy=input]').clear().type(address);
});

Cypress.Commands.add(
  'storageSet',
  (key, value) => new Cypress.Promise(async (resolve) => {
    await browser.storage.local.set({ [key]: value });
    resolve();
  }),
);

Cypress.Commands.add('urlEquals', (route) => {
  cy.url().should('contain', route);
});

Cypress.Commands.add('openNetworks', () => {
  cy.openPageMore()
    .get('[data-cy=settings]')
    .click()
    .get('[data-cy=networks]')
    .click()
    .urlEquals('/more/settings/networks');
});

Cypress.Commands.add('enterNetworkDetails', (network, url, middleware, compiler) => {
  cy.get('[data-cy=network-form]')
    .should('be.visible')
    .get('[data-cy=network] input')
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
    .getByTestId('connect')
    .should('be.visible')
    .buttonShouldBeDisabled('[data-cy=connect]')
    .enterNetworkDetails(network, url, middleware, compiler)
    .getByTestId('connect')
    .click()
    .getByTestId('networks')
    .should('be.visible')
    .get('[data-cy=network-name]')
    .should('contain', network)
    .get('[data-cy=network-url]')
    .should('contain', url)
    .get('[data-cy=network-middleware]')
    .should('contain', middleware);
});

Cypress.Commands.add('openTransactions', () => {
  cy.get('[data-cy=account-card-base]')
    .click()
    .get(`[data-cy=${ROUTE_ACCOUNT_DETAILS_TRANSACTIONS}]`)
    .click()
    .get('[data-cy=loader]')
    .should('be.visible');
});

Cypress.Commands.add('truncateStringShouldContain', (elem, string) => {
  cy.get(elem)
    .should('be.visible')
    .should(($els) => {
      const win = $els[0].ownerDocument.defaultView;
      const before = win.getComputedStyle($els[0], 'before').getPropertyValue('content');
      const after = win.getComputedStyle($els[0], 'after').getPropertyValue('content');
      expect(string).to.eq(`${before.replace(/['"]+/g, '')}${after.replace(/['"]+/g, '')}`);
    });
});
