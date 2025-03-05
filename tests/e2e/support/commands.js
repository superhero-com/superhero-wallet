import '../../../src/lib/initPolyfills';
import { v4 as uuid } from 'uuid';
import {
  APP_LINK_WEB,
  NETWORK_NAME_TESTNET,
  PROTOCOLS,
  STORAGE_KEYS,
} from '@/constants';
import { STUB_ACCOUNT } from '@/constants/stubs';
import {
  generateEncryptionKey,
  encrypt,
  encodeBase64,
  formatDate,
  formatTime,
  generateSalt,
  prepareStorageKey,
} from '@/utils';

export function preparePendingTransactionToLocalStorage(pendingTransaction) {
  const { address } = STUB_ACCOUNT;

  return {
    [address]: { loaded: [], localPendingTransaction: pendingTransaction },
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
    .loginUsingPassword()
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

Cypress.Commands.add('loginUsingPassword', () => {
  cy.get('[data-cy=password] input')
    .should('be.visible')
    .type(STUB_ACCOUNT.password);
  cy.get('[data-cy=login-btn]')
    .should('be.visible')
    .click();
});

Cypress.Commands.add('login', (options, route) => {
  cy.then(async () => {
    const salt = generateSalt();
    const encryptionKey = await generateEncryptionKey(STUB_ACCOUNT.password, salt);
    const mnemonicEncryptionResult = await encrypt(encryptionKey, STUB_ACCOUNT.mnemonic);
    return [mnemonicEncryptionResult, salt];
  }).then(([mnemonicEncryptionResult, salt]) => {
    const { isSeedBackedUp = false, pendingTransaction, network = null } = options || {};

    cy.openPopup(async (contentWindow) => {
      const dataToBeStored = {
        [prepareStorageKey([STORAGE_KEYS.activeNetworkName])]: network || NETWORK_NAME_TESTNET,
        [prepareStorageKey([STORAGE_KEYS.mnemonic])]: mnemonicEncryptionResult,
        [prepareStorageKey([STORAGE_KEYS.encryptionSalt])]: encodeBase64(salt),
        [prepareStorageKey([STORAGE_KEYS.accountsRaw])]: [{
          idx: 0,
          protocol: PROTOCOLS.aeternity,
          isRestored: true,
          type: 'hd-wallet',
        }],
        [prepareStorageKey([STORAGE_KEYS.otherSettings])]: {
          isSeedBackedUp,
        },
        [prepareStorageKey([STORAGE_KEYS.transactionsPending])]: {
          [STUB_ACCOUNT.addressAeternity]: pendingTransaction || [],
        },
        [prepareStorageKey([STORAGE_KEYS.activeAccountGlobalIdx])]: 0,
      };

      Object.entries(dataToBeStored).forEach(([key, data]) => {
        /* eslint-disable-next-line no-param-reassign */
        contentWindow.localStorage[key] = JSON.stringify(data);
      });
    }, route);
    cy.loginUsingPassword();
  });
});

Cypress.Commands.add('logout', () => {
  cy.openPopup(() => localStorage.clear());
});

Cypress.Commands.add('shouldRedirect', (url, to, shouldLogin = false) => {
  cy.visit(`${url}`);
  if (shouldLogin) {
    cy.loginUsingPassword();
  }
  cy.urlEquals(to);
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

Cypress.Commands.add('openSendModal', () => {
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
    .get('[data-cy=networks-settings]')
    .click()
    .urlEquals('/more/settings/networks');
});

/**
 * For the values of the `data-cy` for particular fields please go to `AeternityAdapter`
 * and look for `testId` within the `networkSettings`.
 */
Cypress.Commands.add('enterNetworkDetails', (name, nodeUrl, middlewareUrl) => {
  cy.get('[data-cy=network-form]')
    .should('be.visible')
    .getInputByTestId('network-name')
    .clear()
    .type(name)
    .getInputByTestId('ae-node-url')
    .clear()
    .type(nodeUrl)
    .getInputByTestId('ae-middleware-url')
    .clear()
    .type(middlewareUrl);
});

Cypress.Commands.add('addNetwork', (name, nodeUrl, middlewareUrl) => {
  cy.get('[data-cy=to-add]')
    .click()
    .getByTestId('btn-add-network')
    .should('be.visible')
    .enterNetworkDetails(name, nodeUrl, middlewareUrl)
    .getByTestId('btn-add-network')
    .click()
    .getByTestId('networks')
    .should('be.visible')
    .getInputByTestId('network-name')
    .should('contain', name)
    .getInputByTestId('ae-node-url')
    .should('contain', nodeUrl)
    .getInputByTestId('ae-middleware-url')
    .should('contain', middlewareUrl);
});

Cypress.Commands.add('openTransactions', () => {
  cy.get('[data-cy=account-card-base]')
    .click()
    .get('[data-cy=loader]')
    .should('be.visible');
});

Cypress.Commands.add('splittedStringToBeEqual', (component, string) => {
  cy.get(component)
    .should('be.visible')
    .then((splittedString) => {
      expect(splittedString.text().replaceAll(' ', '')).to.equal(string);
    });
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

Cypress.Commands.add('generateReceiveLinkAndVisit', (address, amount, token = null) => {
  cy.get('[data-cy=receive]')
    .click();

  if (token) {
    cy.get('[data-cy=select-asset]')
      .click()
      .get('.modal .header [data-cy=input]')
      .type(token.contractId)
      .get('.tokens-list-item:first-child', { timeout: 16000 })
      .click();
  }
  cy.splittedStringToBeEqual('[data-cy=qr-code-info]', address)
    .get('[data-cy=input]')
    .type(amount)
    .get('.modal [data-cy=copy]')
    .click();

  cy.window()
    .its('navigator.clipboard')
    .invoke('readText')
    .then(async (text) => {
      const receiveUrl = await text;
      cy.login({}, receiveUrl.replace(APP_LINK_WEB, ''))
        .get('[data-cy=address] [data-cy=textarea]')
        .should('have.value', address)
        .get('[data-cy=amount] [data-cy=input]')
        .should('have.value', amount);

      if (token) {
        cy.get('[data-cy=select-asset]')
          .should('contain', token.name);
      }
      cy.get('[data-cy=btn-close]')
        .click();
    });
});
