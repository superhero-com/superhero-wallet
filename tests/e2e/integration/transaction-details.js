import { testAccount } from '../../../src/popup/utils/config';
import { formatDate, formatTime } from '../../../src/popup/utils';

describe('Tests cases for transaction details page', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Render transaction details', () => {
    cy.get('.transaction-list').children().eq(0).click();
    cy.get('.transaction-details').should('be.visible');
    cy.request(
      `https://testnet.aeternity.io/mdw/txs/backward?account=${testAccount.address}&limit=1`,
    ).then(
      ({
        body: {
          data: [
            {
              hash,
              micro_time: time,
              block_height: blockHeight,
              tx: { amount, nonce, fee },
            },
          ],
        },
      }) => {
        cy.get('[data-cy=hash]').should('contain', hash);
        cy.get('[data-cy=block-height]').should('contain', blockHeight);
        cy.get('[data-cy=amount]').should('contain', amount / 10 ** 18);
        cy.get('[data-cy=nonce]').should('contain', nonce);
        cy.get('[data-cy=fee]').should('contain', fee);
        cy.get('[data-cy=timestamp]')
          .should('contain', formatDate(time))
          .should('contain', formatTime(time));
      },
    );
  });
});
