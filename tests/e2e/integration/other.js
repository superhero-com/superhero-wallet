import { SCHEMA } from '@aeternity/aepp-sdk';
import { STUB_CONTRACT_ADDRESS, STUB_TOKEN_CONTRACT_ADDRESS } from '../../../src/popup/utils';

const ACCOUNT_ADDRESS = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';

const txs = [
  {
    pending: true,
    hash: 'th_',
    amount: 0.1,
    tipUrl: 'http://test.com',
    time: Date.now(),
    tx: {
      type: SCHEMA.TX_TYPE.contractCall,
      callerId: ACCOUNT_ADDRESS,
      contractId: STUB_CONTRACT_ADDRESS,
      function: 'tip',
      selectedTokenContractId: STUB_TOKEN_CONTRACT_ADDRESS,
    },
  },
  {
    pending: true,
    hash: 'th_',
    amount: 0.1,
    type: 'spend',
    time: Date.now(),
    tx: {
      senderId: ACCOUNT_ADDRESS,
      recipientId: ACCOUNT_ADDRESS,
      type: SCHEMA.TX_TYPE.spend,
    },
  },
  {
    pending: true,
    amount: 100,
    recipient: ACCOUNT_ADDRESS,
    hash: 'th_',
    type: 'spendToken',
    pendingTokenTx: true,
    time: Date.now(),
    tx: {
      callerId: ACCOUNT_ADDRESS,
      contractId: STUB_TOKEN_CONTRACT_ADDRESS,
      type: SCHEMA.TX_TYPE.contractCall,
      function: 'transfer',
    },
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
    cy.login().openTransactions();

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
