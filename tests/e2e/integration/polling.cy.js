describe('Polling', () => {
  it('pauses balance polling while the dashboard is hidden', () => {
    cy.clock(Date.now(), ['Date', 'setInterval', 'clearInterval']);
    // Node account requests; the middleware is on the same host under `/mdw`.
    cy.intercept({ method: 'GET', pathname: /^\/v3\/accounts\/ak_\w+$/ }).as('balance');

    cy.login()
      .wait('@balance')
      .openPageMore()
      .location('pathname')
      .should('eq', '/more')
      .get('@balance.all')
      .then((requests) => {
        const count = requests.length;

        cy.tick(10000)
          .get('@balance.all')
          .should('have.length', count)
          .get('[data-cy=back-arrow]:visible')
          .click()
          // The interval fires on the fake clock, but the fetch reaches Cypress asynchronously.
          .wait(1000)
          .get('@balance.all')
          .should('have.length.above', count);
      });
  });
});
