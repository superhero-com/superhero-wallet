import { TXS_PER_PAGE } from '../../../src/popup/utils/constants';

describe('Tests cases for transactions page', () => {
  it('Load transactions, load additional transactions on scroll', () => {
    cy.login()
      .openTransactions()
      .get('[data-cy=list]')
      .children()
      .should((el) => expect(el).to.have.length.greaterThan(1));
    cy.scrollTo('bottom')
      .get('[data-cy=loader]')
      .should('be.visible')
      .get('[data-cy=list]')
      .children()
      .should((el) => expect(el).to.have.length.greaterThan(TXS_PER_PAGE + 1));
  });
});
