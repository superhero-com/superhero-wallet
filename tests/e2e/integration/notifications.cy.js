import { STUB_ACCOUNT, STUB_ADDRESS } from '@/constants/stubs';

/** Two new notifications from the Superhero backend, sent after a signed challenge. */
function interceptBackendNotifications() {
  const notifications = [1, 2].map((id) => ({
    id,
    type: 'COMMENT_ON_TIP',
    status: 'CREATED',
    entityId: `${id}_v3`,
    entityType: 'COMMENT',
    sourceId: '1_v3',
    sourceType: 'TIP',
    sender: STUB_ADDRESS,
    receiver: STUB_ACCOUNT.addressAeternity,
    createdAt: new Date().toISOString(),
  }));
  cy.intercept({ method: 'GET', url: /\/notification\/user\/ak_/ }, (req) => {
    req.reply(req.query.challenge ? notifications : { challenge: 'e2e-challenge' });
  });
}

describe('Tests cases for notifications page and icon', () => {
  beforeEach(interceptBackendNotifications);

  it('counts the backup notification and the backend ones in the badge', () => {
    cy.login()
      .get('[data-cy=notifications-btn] [data-cy=badge-text]')
      .should('be.visible')
      .should('have.text', '3');
  });

  it('Notifications icon should navigate to the notifications list', () => {
    cy.login()
      .get('[data-cy=notifications-btn]')
      .click()
      .urlEquals('/notifications');
  });

  // A backup notification shows before the backend ones, so the badge would go from 1 to 3.
  it('does not count a backup notification once the seed phrase is backed up', () => {
    cy.login({ isSeedBackedUp: true })
      .get('[data-cy=notifications-btn] [data-cy=badge-text]')
      .should('be.visible')
      .should('have.text', '2');
  });
});
