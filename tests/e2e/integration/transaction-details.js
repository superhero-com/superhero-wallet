import { formatDate, formatTime } from '../../../src/utils';
import { NETWORK_MAINNET } from '../../../src/popup/utils/constants';

describe('Tests cases for transaction details page', () => {
  it('Render transaction details', () => {
    cy.login();
    cy.get('.transaction-list').children().eq(2).click();
    cy.get('[data-cy=hash] .value.small').invoke('text').as('transactionHash');
    cy.get('.transaction-details').should('be.visible');
    cy.get('@transactionHash')
      .then((transactionHash) => {
        cy.request(
          `${NETWORK_MAINNET.middlewareUrl}/v2/txs/${transactionHash.trim()}`,
        ).then(
          ({
            body:
            {
              hash,
              micro_time: time,
              block_height: blockHeight,
              tx: { amount, nonce, fee },
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
});
