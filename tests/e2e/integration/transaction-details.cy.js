import { PROTOCOLS } from '@/constants';
import { STUB_ACCOUNT } from '@/constants/stubs';
import { formatDate, formatTime } from '@/utils';

const { addressAeternity } = STUB_ACCOUNT;
const TIME = 1789513172252;
const TRANSACTION = {
  hash: 'th_26iZQ1pXFevyyytFCM9MMFwu1otqW9yHmHgpUFU9evR2r8MV9A',
  block_hash: 'mh_wHszo4QNgYqGW7TgaoHAVytNsvdAEQ9weZUoCN98WA6MXGQhc',
  block_height: 1293234,
  micro_time: TIME,
  tx: {
    amount: 200000000000000000,
    fee: 16860000000000,
    nonce: 15539,
    payload: 'ba_Xfbg4g==',
    recipient_id: 'ak_wMHNCzQJ4HUL3TZ1fi6nQsHg6TjmHLs1bPXSp8iQ1VmxGNAZ4',
    sender_id: addressAeternity,
    type: 'SpendTx',
    version: 1,
  },
};

/** Ignores spaces: the hash is split in groups, amounts and symbols are separate elements. */
function shouldShow(item, text) {
  const withoutSpaces = (value) => `${value}`.replace(/\s/g, '');
  cy.get(`[data-cy=${item}]`)
    .should(($item) => expect(withoutSpaces($item.text())).to.contain(withoutSpaces(text)));
}

function checkDetails() {
  shouldShow('hash', TRANSACTION.hash);
  shouldShow('block-height', TRANSACTION.block_height);
  shouldShow('nonce', TRANSACTION.tx.nonce);
  shouldShow('amount', '0.20 AE');
  shouldShow('fee', '0.00001686 AE');
  shouldShow('total', '0.20001686 AE');
  shouldShow('timestamp', `${formatDate(TIME)} ${formatTime(TIME)}`);
}

/** The list, and the lookups of the details page when the transaction isn't in its cache */
function stubTransaction() {
  cy.intercept({ method: 'GET', url: /\/accounts\/ak_\w+\/activities\?limit=/ }, {
    data: [{ type: 'SpendTxEvent', block_time: TIME, payload: TRANSACTION }],
    next: null,
  });
  cy.intercept({ method: 'GET', url: /\/accounts\/ak_\w+\/activities\?scope=/ }, { data: [], next: null });
  cy.intercept({ method: 'GET', url: new RegExp(`/v3/transactions/${TRANSACTION.hash}$`) }, TRANSACTION);
}

function openFromList(pathname) {
  cy.get('.transaction-item:visible')
    .first()
    .click()
    .location('pathname')
    .should('eq', `${pathname}/transactions/${TRANSACTION.hash}/${addressAeternity}`);
  checkDetails();
}

function goBackTo(pathname) {
  cy.location('pathname').should('eq', pathname)
    .get('.transaction-item:visible')
    .should('have.length', 1);
}

function openCoinPage() {
  cy.login({}, '/account-details')
    .get('[data-cy=account-details-assets]')
    .click()
    .get('.tokens-list-item:visible')
    .first()
    .click()
    .location('pathname')
    .should('eq', '/coins/aeternity');
}

describe('Tests cases for transaction details page', () => {
  it('shows a transaction opened from the dashboard and goes back to it', () => {
    stubTransaction();
    cy.login();
    openFromList('/account');
    cy.get('[data-cy=back-arrow]:visible').click();
    goBackTo('/account');
  });

  it('goes back to the dashboard by the browser history', () => {
    stubTransaction();
    cy.login();
    openFromList('/account');
    cy.go('back');
    goBackTo('/account');
  });

  it('shows a transaction opened by its link', () => {
    stubTransaction();
    cy.login({}, `/account-details/transactions/${TRANSACTION.hash}/${addressAeternity}`);
    checkDetails();
  });

  it('goes back to the coin page it was opened from, with its details', () => {
    stubTransaction();
    openCoinPage();
    openFromList('/coins/aeternity');
    cy.get('[data-cy=back-arrow]:visible').click();
    goBackTo('/coins/aeternity');
    cy.contains('.tab:visible', 'Coin details')
      .click()
      .get('.token-details:visible')
      .should('contain', 'Decimals');
  });

  // X keeps the pages under the one it closes, and opening one again shows the previous account
  it('shows the account switched to after a transaction is closed', () => {
    stubTransaction();
    cy.login({
      accountsRaw: [0, 1].map((idx) => ({
        idx,
        protocol: PROTOCOLS.aeternity,
        isRestored: true,
        type: 'hd-wallet',
      })),
    }, '/account-details');
    openFromList('/account-details');
    cy.get('[data-cy=btn-close]:visible')
      .click()
      .location('pathname')
      .should('eq', '/account')
      .get('[data-cy=account-card-btn-next]')
      .click()
      .get('.swiper-slide-active [data-cy=account-card-base]')
      .click()
      .location('pathname')
      .should('eq', '/account-details')
      .get('.transaction-item:visible')
      .should('have.length', 1)
      .and('have.attr', 'href')
      .and('match', /\/ak_\w+$/)
      .and('not.contain', addressAeternity);
  });

  it('goes back to the coin page from its transaction link', () => {
    stubTransaction();
    cy.login({}, `/coins/aeternity/transactions/${TRANSACTION.hash}/${addressAeternity}`);
    checkDetails();
    cy.get('[data-cy=back-arrow]:visible').click();
    goBackTo('/coins/aeternity');
  });
});
