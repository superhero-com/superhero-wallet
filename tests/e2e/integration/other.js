import { transactions } from '../../../src/popup/utils/testsConfig';

const ACCOUNT_ADDRESS = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';
const txs = [
  transactions.pendingSpend,
  transactions.pendingTransfer,
  {
    ...transactions.pendingTipToken,
    tx: { ...transactions.pendingTipToken.tx, callerId: ACCOUNT_ADDRESS },
  },
  {
    ...transactions.pendingTipAe,
    tx: { ...transactions.pendingTipAe.tx, callerId: ACCOUNT_ADDRESS },
  },
];

describe('Tests cases not connected to specific page', () => {
  it('(not) redirects to last visited routes', () => {
    [
      { path: '/notifications', redirect: false },
      { path: '/account-details/names', redirect: true },
      { path: '/more/about', redirect: true },
      { path: '/account-details/transactions', redirect: true },
    ].forEach(({ path, redirect }) => {
      cy.login({}, path)
        .visit('')
        .urlEquals(redirect ? path : '/account');
    });
  });

  it('Shows pending tx', () => {
    txs.forEach((pendingTransaction) => {
      cy.login({ pendingTransaction })
        .get('[data-cy=pending-txs]')
        .should('be.visible');
    });
  });

  it('Connection message disappear', () => {
    cy.login().get('[data-cy=connect-node]').should('not.exist');
  });
});
