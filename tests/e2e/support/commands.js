import '../../../src/lib/initPolyfills';
import { v4 as uuid } from 'uuid';
import {
  APP_LINK_WEB,
  LOCAL_STORAGE_PREFIX,
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
import { TEST_ACCOUNT } from '../../fixtures/account';

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

// Cypress clears cookies and web storage, but IndexedDB needs an explicit reset
// before a visit starts restoring the next fixture wallet.
Cypress.Commands.add('clearAllIndexedDB', () => cy.then(() => (
  window.indexedDB.databases().then((databases) => Cypress.Promise.all(databases
    .filter(({ name }) => name)
    .map(({ name }) => new Cypress.Promise((resolve, reject) => {
      const request = window.indexedDB.deleteDatabase(name);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error(`The fixture database "${name}" is still open`));
    }))))
)));

// Read the persisted browser record directly; importing the app's vault service
// here would create a separate cached instance in the Cypress support window.
function readStoredVault(contentWindow) {
  return new Cypress.Promise((resolve, reject) => {
    const request = contentWindow.indexedDB.open(`${LOCAL_STORAGE_PREFIX}-vault`);
    let missing = false;
    request.onupgradeneeded = () => {
      missing = true;
      request.transaction.abort();
    };
    request.onerror = () => (missing ? resolve(null) : reject(request.error));
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('vault', 'readonly');
      const read = transaction.objectStore('vault').get('current');
      transaction.oncomplete = () => { db.close(); resolve(read.result ?? null); };
      transaction.onabort = () => { db.close(); reject(transaction.error); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
    };
  });
}

/** One read: `.should()` retries only the assertion, it never reads again. */
Cypress.Commands.add('getStoredVault', () => cy.window().then(readStoredVault));

/**
 * Reads the stored vault again until `predicate` accepts it, as the app stores it
 * asynchronously. Custom queries must be synchronous, so this polls instead of retrying.
 */
Cypress.Commands.add('waitForStoredVault', (predicate, { timeout = 10000 } = {}) => (
  cy.window().then({ timeout: timeout + 1000 }, (contentWindow) => {
    const deadline = Date.now() + timeout;
    const poll = () => readStoredVault(contentWindow).then((vault) => {
      if (predicate(vault)) return vault;
      if (Date.now() > deadline) {
        throw new Error(`The stored vault (revision ${vault?.revision}) never matched`);
      }
      return Cypress.Promise.delay(100).then(poll);
    });
    return poll();
  })
));

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
  // Be tolerant to different render timings/selectors (InputField uses data-cy=input)
  cy.get(
    '[data-cy=password] [data-cy=input], [data-cy=password] input, input[type="password"]',
    { timeout: 30000 },
  )
    .should('be.visible')
    .first()
    .type(TEST_ACCOUNT.password, { log: true });

  cy.get('[data-cy=login-btn], [data-cy=login], button[type="submit"]', { timeout: 20000 })
    .should('be.visible')
    .first()
    .click();
});

Cypress.Commands.add('login', (options, route) => {
  cy.clearAllIndexedDB();
  cy.then(async () => {
    const salt = generateSalt();
    const encryptionKey = await generateEncryptionKey(TEST_ACCOUNT.password, salt);
    const mnemonicEncryptionResult = await encrypt(encryptionKey, TEST_ACCOUNT.mnemonic);
    return [mnemonicEncryptionResult, salt];
  }).then(([mnemonicEncryptionResult, salt]) => {
    const {
      isSeedBackedUp = false,
      pendingTransaction,
      network = null,
      accountsRaw = [{
        idx: 0,
        protocol: PROTOCOLS.aeternity,
        isRestored: true,
        type: 'hd-wallet',
      }],
      privateKeyAccountsRaw,
      activeAccountGlobalIdx = 0,
    } = options || {};

    cy.openPopup((contentWindow) => {
      /**
       * Full clear before seeding avoids stale keys from a prior test or
       * `cy.login` chain leaving half-initialized state that skips the
       * password modal or wedges `checkUserAuth`.
       */
      contentWindow.localStorage.clear();
      if (contentWindow.sessionStorage) {
        contentWindow.sessionStorage.clear();
      }

      const dataToBeStored = {
        [prepareStorageKey([STORAGE_KEYS.activeNetworkName])]: network || NETWORK_NAME_TESTNET,
        [prepareStorageKey([STORAGE_KEYS.mnemonic])]: mnemonicEncryptionResult,
        [prepareStorageKey([STORAGE_KEYS.encryptionSalt])]: encodeBase64(salt),
        [prepareStorageKey([STORAGE_KEYS.accountsRaw])]: accountsRaw,
        [prepareStorageKey([STORAGE_KEYS.otherSettings])]: {
          isSeedBackedUp,
        },
        [prepareStorageKey([STORAGE_KEYS.transactionsPending])]: {
          [STUB_ACCOUNT.addressAeternity]: pendingTransaction || [],
        },
        [prepareStorageKey([STORAGE_KEYS.activeAccountGlobalIdx])]: activeAccountGlobalIdx,
        ...privateKeyAccountsRaw && {
          [prepareStorageKey([STORAGE_KEYS.privateKeyAccountsRaw])]: privateKeyAccountsRaw,
        },
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
  cy.clearAllIndexedDB();
  cy.openPopup((contentWindow) => contentWindow.localStorage.clear());
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

Cypress.Commands.add('openSendModal', () => {
  cy.get('[data-cy=send]').click();
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
  cy.get('[data-cy=address] [data-cy=textarea]').clear().type(address);
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

Cypress.Commands.add('openSecureLoginSettings', () => {
  cy.openPageMore()
    .get('[data-cy=settings]')
    .click()
    .get('[data-cy=secure-login-settings]')
    .click()
    .urlEquals('/more/settings/secure-login');
});

/**
 * The form has a group of fields per protocol, each field's `data-cy` is its setting key.
 * Scrolling a field to the top would put it under the page header.
 */
Cypress.Commands.add('enterNetworkDetails', (name, nodeUrl, middlewareUrl) => {
  const options = { scrollBehavior: 'center' };
  cy.get('[data-cy=network-form]')
    .should('exist')
    .getInputByTestId('network-name')
    .clear(options)
    .type(name, options)
    .get('[data-cy=group-aeternity] [data-cy=nodeUrl] input')
    .clear(options)
    .type(nodeUrl, options)
    .get('[data-cy=group-aeternity] [data-cy=middlewareUrl] input')
    .clear(options)
    .type(middlewareUrl, options);
});

Cypress.Commands.add('addNetwork', (name, nodeUrl, middlewareUrl) => {
  cy.get('[data-cy=to-add]')
    .click()
    .enterNetworkDetails(name, nodeUrl, middlewareUrl)
    .getByTestId('btn-add-network')
    .should('not.have.class', 'disabled')
    .click();
  cy.contains('[data-cy=networks] .network-row', name)
    .should('contain', nodeUrl.replace('https://', ''));
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
      cy.login({}, receiveUrl.replace(APP_LINK_WEB, ''));

      cy.formRecipientAddressToBeEqual(address);

      cy.get('[data-cy=amount] [data-cy=input]')
        .should('have.value', amount);

      if (token) {
        cy.get('[data-cy=select-asset]')
          .should('contain', token.name);
      }

      cy.get('[data-cy=btn-close]')
        .click();
    });
});

Cypress.Commands.add('formRecipientAddressToBeEqual', (address) => {
  cy.get('[data-cy="input-wrapper"] .truncate');

  cy.document().then(($document) => {
    // When a valid address (based on selected coin) is entered, the format changes
    const documentResult = $document.querySelectorAll('[data-cy=input-wrapper] .under .address-truncated .address-chunk:first-child');
    if (documentResult.length) {
      cy.get('[data-cy=input-wrapper] .under .address-truncated .address-chunk:first-child')
        .should('be.visible')
        .should('have.text', address.substr(0, 6));
      cy.get('[data-cy=input-wrapper] .under .address-truncated .address-chunk:last-child')
        .should('be.visible')
        .should('have.text', address.substr(-3));
    } else {
      // Invalid address
      cy.get('[data-cy=input-wrapper] .truncate')
        .should('be.visible')
        .should('have.text', address);
    }
  });
});

Cypress.Commands.add('addEthereumBitcoinAccounts', () => {
  // Ethereum
  cy.get('[data-cy=bullet-switcher-add]')
    .click()
    .get('[data-cy=account-card-add]')
    .click()
    .get('.button-subheader ')
    .eq(1)
    .click()
    .get('[data-cy=create-plain-account]')
    .click()
    // Bitcoin
    .get('[data-cy=bullet-switcher-add]')
    .click()
    .get('[data-cy=account-card-add]')
    .click()
    .get('.button-subheader ')
    .eq(0)
    .click()
    .get('[data-cy=create-plain-account]')
    .click();
});
