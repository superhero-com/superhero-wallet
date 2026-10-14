describe('Polling', () => {
  it('pauses balance polling while the dashboard is hidden', () => {
    // Node account requests; the middleware is on the same host under `/mdw`.
    cy.intercept({ method: 'GET', pathname: /^\/v3\/accounts\/ak_\w+$/ }).as('balance');

    cy.login()
      .wait('@balance')
      .openPageMore()
      .location('pathname')
      .should('eq', '/more')
      // Lets requests started before the dashboard got hidden be recorded
      .wait(1000)
      .get('@balance.all')
      .then((requests) => {
        const count = requests.length;

        // Longer than the 8s balance polling interval
        cy.wait(10000)
          .get('@balance.all')
          .should('have.length', count)
          .get('[data-cy=back-arrow]:visible')
          .click()
          .get('@balance.all')
          .should('have.length.above', count);
      });
  });
});
