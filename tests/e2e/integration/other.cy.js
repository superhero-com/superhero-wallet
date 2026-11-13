import { STUB_ACCOUNT, STUB_TRANSACTIONS } from '../../../src/constants/stubs';
import locale from '../../../src/popup/locales/en-US.json';

const RECEIVING = `${locale.transaction.type.receivedTx}...`;
// TODO: add `pendingTipToken` once a pending token tip stops showing its amount in AE
const pendingTransactions = [
  { transaction: STUB_TRANSACTIONS.pendingSpend, text: ['0.74 AE', RECEIVING] },
  { transaction: STUB_TRANSACTIONS.pendingTransfer, text: ['0.20 AMZ', RECEIVING] },
  {
    transaction: {
      ...STUB_TRANSACTIONS.pendingTipAe,
      tx: { ...STUB_TRANSACTIONS.pendingTipAe.tx, callerId: STUB_ACCOUNT.addressAeternity },
    },
    text: ['− 0.20 AE', locale.common.pending],
  },
];

describe('Tests cases not connected to specific page', () => {
  it('(not) redirects to last visited routes', () => {
    [
      { path: '/notifications', redirect: false },
      { path: '/account-details/names', redirect: true },
      { path: '/more/about', redirect: true },
      { path: '/account-details/', redirect: true },
      { path: '/more/about?source=e2e#version', redirect: true },
      { path: '/coins/aeternity', redirect: true },
    ].forEach(({ path, redirect }) => {
      cy.login({}, path)
        // The route is saved before its page mounts, which can wait for a lazy chunk
        .get('.router-outlet .ion-page', { timeout: 10000 })
        .should('exist')
        .visit('')
        .loginUsingPassword()
        .location()
        .should(({ pathname, search, hash }) => {
          expect(pathname + search + hash).to.equal(redirect ? path : '/account');
        });
    });
  });

  it('shows the amount and state of each pending transaction type', () => {
    pendingTransactions.forEach(({ transaction, text }) => {
      cy.login({
        isSeedBackedUp: true,
        pendingTransactions: [{
          ...transaction,
          hash: 'th_fxSJErbUC3WAqiURFSWhafRdxJC6wzbj5yUKmLTUte6bNWLB8',
          transactionOwner: STUB_ACCOUNT.addressAeternity,
        }],
      })
        .get('[data-cy=pending-txs]')
        .should('have.length', 1)
        .should(($item) => {
          const itemText = $item.text().replace(/\s/g, '');
          text.forEach((part) => expect(itemText).to.contain(part.replace(/\s/g, '')));
        });
    });
  });

  it('shows the offline message until the connection is back', () => {
    const message = locale.connectionStatus.offline.statusMessage;
    cy.login();
    cy.window().then((win) => win.dispatchEvent(new win.Event('offline')));
    cy.get('[data-cy=connection-status]')
      .should('contain', message);
    cy.window().then((win) => win.dispatchEvent(new win.Event('online')));
    cy.contains('[data-cy=connection-status]', message)
      .should('not.exist');
  });
});
