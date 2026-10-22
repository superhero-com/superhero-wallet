import { TXS_PER_PAGE } from '@/constants';
import { STUB_ACCOUNT } from '@/constants/stubs';

const { addressAeternity } = STUB_ACCOUNT;
const OTHER_ADDRESS = 'ak_wMHNCzQJ4HUL3TZ1fi6nQsHg6TjmHLs1bPXSp8iQ1VmxGNAZ4';

/**
 * Chrome and Firefox scroll the inner part of ion-content, other browsers the ion-content itself.
 * Cypress runs with a mobile Safari user agent, so the class switches to the Chrome way.
 */
const SCROLL_MODES = [
  { name: 'ion-content scrolls', htmlClass: null },
  { name: 'ion-content part scrolls', htmlClass: 'is-chrome' },
];

function getSpendActivities(from, count, { isReceived = false } = {}) {
  return Array.from({ length: count }, (_, i) => {
    const index = from + i;
    const time = 1789513172252 - index * 60000;
    return {
      type: 'SpendTxEvent',
      block_time: time,
      payload: {
        hash: `th_2XVAGuULHCkQjFsY5ehVe17AWDxxNFtwt6SCD2m5RyKgKRaN${index}`,
        block_height: 1293234 - index,
        micro_time: time,
        tx: {
          amount: 200000000000000000,
          fee: 16860000000000,
          nonce: 15539 - index,
          payload: 'ba_Xfbg4g==',
          recipient_id: isReceived ? addressAeternity : OTHER_ADDRESS,
          sender_id: isReceived ? OTHER_ADDRESS : addressAeternity,
          type: 'SpendTx',
          version: 1,
        },
      },
    };
  });
}

// The first page is sent transactions only, so received ones come from the next page
function interceptActivities(firstPageSize) {
  cy.intercept({ method: 'GET', url: new RegExp(`/activities\\?limit=${TXS_PER_PAGE}$`) }, {
    data: getSpendActivities(0, firstPageSize),
    next: `/v2/accounts/${addressAeternity}/activities?cursor=1&limit=${TXS_PER_PAGE}`,
  }).as('firstPage');
  cy.intercept({ method: 'GET', url: new RegExp(`/activities\\?cursor=1&limit=${TXS_PER_PAGE}$`) }, {
    data: getSpendActivities(firstPageSize, 20, { isReceived: true }),
    next: null,
  }).as('nextPage');
}

function openTransactionList(htmlClass) {
  cy.login();
  if (htmlClass) {
    cy.document().then((doc) => doc.documentElement.classList.add(htmlClass));
  }
  cy.get('[data-cy=account-card-base]')
    .click();
}

function scrollTransactionListToBottom() {
  cy.get('.transaction-list:visible').then(($content) => {
    const host = $content[0];
    const inner = host.shadowRoot.querySelector('[part=scroll]');
    const scrollElement = [host, inner].reduce((best, candidate) => (
      candidate.scrollHeight - candidate.clientHeight
        > best.scrollHeight - best.clientHeight ? candidate : best
    ));
    cy.wrap(scrollElement).scrollTo('bottom');
  });
}

describe('Transactions', () => {
  SCROLL_MODES.forEach(({ name, htmlClass }) => {
    describe(`when ${name}`, () => {
      it('loads the next page after scrolling to the bottom', () => {
        interceptActivities(TXS_PER_PAGE);
        openTransactionList(htmlClass);

        cy.wait('@firstPage');
        cy.get('.transaction-list:visible [data-cy=list] .vs-row')
          .should('have.length.above', 5)
          .get('[data-cy=loader]')
          .should('not.exist');
        cy.get('.transaction-list:visible').then(($content) => {
          const host = $content[0];
          const inner = host.shadowRoot.querySelector('[part=scroll]');
          const scrollElement = [host, inner].reduce((best, candidate) => (
            candidate.scrollHeight - candidate.clientHeight
              > best.scrollHeight - best.clientHeight ? candidate : best
          ));
          expect(scrollElement.scrollHeight).to.be.greaterThan(
            scrollElement.clientHeight + 100,
          );
        });
        cy.get('@nextPage.all').should('have.length', 0);
        scrollTransactionListToBottom();
        cy.wait(2000)
          .wait('@nextPage')
          .get('.transaction-list:visible [data-cy=list] .vs-row')
          .should('contain', 'Received');
      });

      it('loads the next page while the list does not fill the screen', () => {
        interceptActivities(2);
        openTransactionList(htmlClass);

        cy.wait('@nextPage')
          .get('.transaction-list:visible [data-cy=list] .vs-row')
          .should('contain', 'Received');
      });
    });
  });
});
