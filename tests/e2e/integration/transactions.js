import { TXS_PER_PAGE } from '../../../src/popup/utils/constants';
import { testAccount } from '../../../src/popup/utils/config';
import { formatDate } from '../../../src/popup/utils';

describe('Tests cases for transactions page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Load transactions, load additional transactions on scroll', () => {
    cy.openTransactions()
      .get('[data-cy=all-transactions]')
      .children()
      .should('have.length', TXS_PER_PAGE);

    cy.scrollTo('bottom')
      .get('[data-cy=loader]')
      .should('be.visible')
      .get('[data-cy=all-transactions]')
      .children()
      .should('have.length', TXS_PER_PAGE * 2);
  });

  it('Render transaction item', () => {
    cy.openTransactions()
      .request(
        `https://testnet.aeternity.io/mdw/txs/backward?account=${testAccount.publicKey}&limit=1`,
      )
      .then(({ body }) => {
        const {
          // eslint-disable-next-line camelcase
          micro_time,
          tx: { amount },
        } = body.data[0];
        cy.get('[data-cy=all-transactions] > li')
          .eq(0)
          .then(e => {
            cy.wrap(e)
              .find('[data-cy=amount]')
              .should('contain', amount / 10 ** 18);
            cy.wrap(e)
              .find('[data-cy=time]')
              .should('contain', formatDate(micro_time));
            cy.wrap(e)
              .find('[data-cy=currency-amount]')
              .should('be.visible');
          });
      });
  });
});
