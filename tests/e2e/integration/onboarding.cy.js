import { NETWORK_NAME_TESTNET, STORAGE_KEYS } from '@/constants';
import { prepareStorageKey } from '@/utils';
import { TEST_ACCOUNT } from '../../fixtures/account';

const MNEMONIC_KEY = prepareStorageKey([STORAGE_KEYS.mnemonic]);
const ACCOUNTS_KEY = prepareStorageKey([STORAGE_KEYS.accountsRaw]);

function getStoredItem(key) {
  return cy.window().then((win) => win.localStorage.getItem(key));
}

describe('Onboarding', () => {
  it('creates a wallet on a fresh install without asking', () => {
    cy.openPopup((contentWindow) => {
      contentWindow.localStorage.clear();
      // eslint-disable-next-line no-param-reassign
      contentWindow.localStorage[prepareStorageKey([STORAGE_KEYS.activeNetworkName])] = (
        JSON.stringify(NETWORK_NAME_TESTNET)
      );
    });

    cy.get('[data-cy=checkbox]')
      .click()
      .get('[data-cy=generate-wallet]')
      .click()
      .get('[data-cy=btn-add-aeternity]')
      .click()
      .get('[data-cy=password] input')
      .type(TEST_ACCOUNT.password)
      .get('[data-cy=confirm-password] input')
      .type(TEST_ACCOUNT.password)
      .get('[data-cy=btn-set-password]')
      .click()
      .get('[data-cy=balance-info]')
      .should('be.visible');
    getStoredItem(MNEMONIC_KEY).should('not.be.empty');
  });

  // E.g. the popup closed while an import was still discovering the accounts.
  it('opens a stored wallet that has no accounts instead of the start page', () => {
    cy.login({ accountsRaw: [] });
    getStoredItem(MNEMONIC_KEY).then((storedMnemonic) => {
      // Longer than the restore timeout, after which the first account is opened anyway.
      cy.get('[data-cy=balance-info]', { timeout: 40000 })
        .should('be.visible')
        .urlEquals('/account')
        .get('[data-cy=generate-wallet]')
        .should('not.exist');
      getStoredItem(MNEMONIC_KEY).should('eq', storedMnemonic);
      getStoredItem(ACCOUNTS_KEY)
        .then((accountsRaw) => JSON.parse(accountsRaw))
        .should('have.length.at.least', 1);
    });
  });
});
