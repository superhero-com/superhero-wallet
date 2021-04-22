const txs = [
  {
    hash: 'th_', amount: 0.1, domain: 'localhost:5000', time: Date.now(), type: 'tip',
  },
  {
    hash: 'th_', amount: 2, domain: 'localhost:8000', time: Date.now(), type: 'tip',
  },
  {
    hash: 'th_', amount: 10, domain: 'localhost:8080', time: Date.now(), type: 'tip',
  },
];

describe('Tests cases not connected to specific page', () => {
  it('(not) redirects to last visited routes', () => {
    [
      { path: '/success-tip', redirect: false },
      { path: '/intro', redirect: false },
      { path: '/notifications', redirect: false },
      { path: '/tips', redirect: true },
      { path: '/receive', redirect: true },
      { path: '/payments', redirect: true },
      { path: '/names', redirect: true },
      { path: '/about', redirect: true },
      { path: '/transactions', redirect: true },
    ].forEach(({ path, redirect }) => {
      cy.login({}, path)
        .get('[data-cy=connect-node]')
        .visit('extension/popup/popup')
        .urlEquals(redirect ? path : '/account');
    });
  });

  it('Shows pending tx', () => {
    txs.forEach((pendingTransaction) => {
      cy.login({ pendingTransaction }).get('[data-cy=pending-txs]').should('be.visible');
    });
  });

  it('Connection message disappear', () => {
    cy.login().get('[data-cy=connect-node]').should('not.exist');
  });
});
