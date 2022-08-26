// const txs = [
//   {
//     pending: true,
//     hash: 'th_',
//     amount: 0.1,
//     domain: 'localhost:5000',
//     time: Date.now(),
//     tx: { type: 'tip', senderId: 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5' },
//   },
//   {
//     pending: true,
//     hash: 'th_',
//     amount: 2,
//     domain: 'localhost:8000',
//     time: Date.now(),
//     tx: { type: 'tip', senderId: 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5' },
//   },
//   {
//     pending: true,
//     hash: 'th_',
//     amount: 10,
//     domain: 'localhost:8080',
//     time: Date.now(),
//     tx: { type: 'tip', senderId: 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5' },
//   },
// ];

describe('Tests cases not connected to specific page', () => {
  it('(not) redirects to last visited routes', () => {
    [
      { path: '/notifications', redirect: false },
      { path: '/tips', redirect: false },
      { path: '/names', redirect: true },
      { path: '/more/about', redirect: true },
      { path: '/transactions', redirect: true },
    ].forEach(({ path, redirect }) => {
      cy.login({}, path)
        .get('[data-cy=connect-node]')
        .visit('')
        .urlEquals(redirect ? path : '/account');
    });
  });

  // it('Shows pending tx', () => {
  //   txs.forEach((pendingTransaction) => {
  //     cy.login({ pendingTransaction }).get('[data-cy=pending-txs]').should('be.visible');
  //   });
  // });

  it('Connection message disappear', () => {
    cy.login().get('[data-cy=connect-node]').should('not.exist');
  });
});
