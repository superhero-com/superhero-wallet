import { STUB_ACCOUNT, STUB_TRANSACTIONS } from '../../../src/constants/stubs';

const txs = [
  STUB_TRANSACTIONS.pendingSpend,
  STUB_TRANSACTIONS.pendingTransfer,
  {
    ...STUB_TRANSACTIONS.pendingTipToken,
    tx: { ...STUB_TRANSACTIONS.pendingTipToken.tx, callerId: STUB_ACCOUNT.addressAeternity },
  },
  {
    ...STUB_TRANSACTIONS.pendingTipAe,
    tx: { ...STUB_TRANSACTIONS.pendingTipAe.tx, callerId: STUB_ACCOUNT.addressAeternity },
  },
];

describe('Tests cases not connected to specific page', () => {
  it('(not) redirects to last visited routes', () => {
    [
      { path: '/notifications', redirect: false },
      { path: '/account-details/names', redirect: true },
      { path: '/more/about', redirect: true },
      { path: '/account-details/', redirect: true },
    ].forEach(({ path, redirect }) => {
      cy.login({}, path)
        .visit('')
        .urlEquals(redirect ? path : '/account');
    });
  });

  it('Shows pending tx', () => {
    txs.forEach((pendingTransaction) => {
      cy.login({
        isSeedBackedUp: true,
        pendingTransaction: {
          ...pendingTransaction,
          hash: 'th_fxSJErbUC3WAqiURFSWhafRdxJC6wzbj5yUKmLTUte6bNWLB8',
          transactionOwner: STUB_ACCOUNT.addressAeternity,
        },
      })
        .get('[data-cy=pending-txs]')
        .should('be.visible');
    });
  });

  it('Connection message disappear', () => {
    cy.login().get('[data-cy=connection-status]').should('not.exist');
  });
});
