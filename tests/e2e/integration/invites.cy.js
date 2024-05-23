// import { APP_LINK_WEB } from '@/constants';

const legacyInviteUrl = '/invite/7heh8jzN54669JMV34vHcfp2SKJAzcAAZCe2XtC76hec2E4f6jGJtYQT8nrf52oRiGpEQ95srA5dT4DFQatRo6XrFqFXa';
const currentInviteUrl = '/invite#PZK6m94Sc5X2ibggH4sFPnG98GGdhCMzbpbHju4jSWxpoD4uB';
const testAmount = 0.001;
// let inviteUrl;

// TODO: enable this test after https://github.com/aeternity/aepp-sdk-js/issues/291 is fixed and published
describe('Test cases for invite page', () => {
  it.skip('Generates, top-ups, collapses, claims back, deletes invite', () => {
    cy.login()
      .openPageMore()
      .get('[data-cy=invite]')
      .click()
      .get('[data-cy=invite-generate]')
      .should('have.class', 'disabled')
      .get('[data-cy=input]')
      .type(testAmount)
      .get('[data-cy=invite-generate]', { timeout: 10000 })
      .should('not.have.class', 'disabled')
      .click()
      .get('[data-cy=invite-item] .token-amount .amount', { timeout: 10000 })
      .should('contain', testAmount)
      .get('[data-cy=invite-top-up]')
      .click()
      .get('.ion-page.can-go-back:not(.ion-page-hidden) .ion-content-bg')
      .scrollTo('bottom')
      .get('[data-cy=collapse]')
      .should('be.visible')
      .click()
      .get('[data-cy=collapse]')
      .should('not.exist')
      .get('[data-cy=invite-top-up]')
      .click()
      .get('[data-cy=input]')
      .eq(1)
      .type(testAmount)
      .get('[data-cy=send-top-up]')
      .click()
      .get('[data-cy=invite-item] .token-amount .amount', { timeout: 15000 })
      .should('contain', 2 * testAmount)
      .get('[data-cy=invite-delete]')
      .should('not.exist')
      .get('[data-cy=invite-claim]')
      .click()
      .get('[data-cy=loader]')
      .should('be.visible')
      .get('[data-cy=loader]', { timeout: 10000 })
      .should('not.exist')
      .get('[data-cy=invite-item] .token-amount .amount')
      .should('contain', '0')
      .get('[data-cy=invite-delete]')
      .should('be.visible')
      .click();
  });

  it('Opens legacy invite link, opens invite link, redeems partially, redeems fully', () => {
    cy.login({}, legacyInviteUrl)
      .get('.modal [data-cy=balance-info] .asset-fractional')
      .should('be.visible')
      .get('[data-cy=redeem-main-btn')
      .should('be.visible');

    cy.login({}, currentInviteUrl)
      .get('.modal [data-cy=balance-info] .asset-fractional')
      .should('be.visible')
      .get('[data-cy=redeem-main-btn')
      .should('be.visible');
    /*
    cy.login()
      .openPageMore()
      .get('[data-cy=invite]')
      .click()
      .get('[data-cy=invite-generate]')
      .should('have.class', 'disabled')
      .get('[data-cy=input]')
      .type(2 * testAmount)
      .get('[data-cy=invite-generate]')
      .click()
      .get('[data-cy=loader]')
      .should('be.visible')
      .get('[data-cy=loader]', { timeout: 10000 })
      .should('not.exist')
      .get('[data-cy=invite-link-url]')
      .then((url) => {
        inviteUrl = url.text();
        cy.login({}, inviteUrl.replace(APP_LINK_WEB, ''))
          .get('.modal [data-cy=balance-info] .asset-fractional')
          .should('contain', (2 * testAmount).toString().substring(2))
          .get('[data-cy=redeem-secondary-btn]')
          .click()
          .enterInputAmount(testAmount)
          .get('[data-cy=redeem-main-btn')
          .click()
          .get('[data-cy=redeem-main-btn', { timeout: 10000 })
          .should('not.have.class', 'disabled')
          .get('[data-cy=redeem-secondary-btn]')
          .should('not.exist')
          .get('[data-cy=redeem-main-btn]')
          .click()
          .login({}, inviteUrl.replace(APP_LINK_WEB, ''))
          .get('[data-cy=redeem-secondary-btn]')
          .should('be.visible')
          .get('[data-cy=redeem-main-btn]')
          .click()
          .get('.modal [data-cy=balance-info] .asset-fractional', { timeout: 10000 })
          .should('contain', '00')
          .get('[data-cy=redeem-main-btn]', { timeout: 10000 })
          .should('not.have.class', 'disabled')
          .click();
      });
    */
  });
});
