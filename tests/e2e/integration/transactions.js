import { TXS_PER_PAGE } from '../../../src/popup/utils/constants';
import { testAccount } from '../../../src/popup/utils/config';
import { formatDate } from '../../../src/popup/utils';

describe('Tests cases for transactions page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Open transactions', () => {
    cy.openTransactions();
  });

  it('Load transactions', () => {
    cy.openTransactions()
      .get('[data-cy=all-transactions]')
      .children()
      .should('have.length', TXS_PER_PAGE);
  });

  it('Load transactions on scroll', () => {
    cy.openTransactions();
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
        `https://testnet.aeternal.io/middleware/transactions/account/${testAccount.publicKey}?limit=1`,
      )
      .then(({ body }) => {
        const {
          time,
          tx: { amount },
        } = body[0];
        cy.get('[data-cy=all-transactions] > li')
          .eq(0)
          .then(e => {
            cy.wrap(e)
              .find('[data-cy=amount]')
              .should('contain', amount / 10 ** 18);
            cy.wrap(e)
              .find('[data-cy=time]')
              .should('contain', formatDate(time));
            cy.wrap(e)
              .find('[data-cy=currency-amount]')
              .should('be.visible');
          });
      });
  });
});
