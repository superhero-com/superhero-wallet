const txs = [
  { hash: '', amount: 0.1, domain: 'localhost:5000', time: Date.now(), type: 'tip' },
  { hash: '', amount: 2, domain: 'localhost:8000', time: Date.now(), type: 'tip' },
  { hash: '', amount: 10, domain: 'localhost:8080', time: Date.now(), type: 'tip' },
];

describe('Tests cases not connected to specific page', () => {
  [
    { path: '/popup-sign-tx', redirect: false },
    { path: '/connect', redirect: false },
    { path: '/sign-transaction', redirect: false },
    { path: '/ask-accounts', redirect: false },
    { path: '/message-sign', redirect: false },
    { path: '/success-tip', redirect: false },
    { path: '/qrCodeReader', redirect: false },
    { path: '/intro', redirect: false },
    { path: '/notifications', redirect: false },
    { path: '/auction-bid', redirect: false },
    { path: '/tip', redirect: true },
    { path: '/receive', redirect: true },
    { path: '/send', redirect: true },
    { path: '/names', redirect: true },
    { path: '/aboutSettings', redirect: true },
    { path: '/transactions', redirect: true },
  ].forEach(({ path, redirect }) => {
    it(`${redirect ? '' : 'no '}redirect to last visited route ${path}`, () => {
      cy.login()
        .visit(`chrome/popup/popup#${path}`)
        .visit(`chrome/popup/popup`)
        .urlEquals(redirect ? path : '/account');
    });
  });

  txs.forEach(tx => {
    it('Show pending tx', () => {
      cy.setPendingTx(tx).login();
    });
  });

  it('Connection message disappear', () => {
    cy.login()
      .get('[data-cy=connect-node]')
      .should('not.be.visible');
  });
});
