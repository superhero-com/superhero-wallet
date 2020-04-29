import { testAccount } from '../../../src/popup/utils/config';

require('chai').should();

const messageSig =
  'f85fd998cdf48c96ddf52d3a62edc3245a196db97d6898a45083e74b587dae4ba5d4baa4c6c247e109af4930ca117b72f849732f6586782ca8845a11cbf6f400';
describe('Tests cases for AEX-2 communication', () => {
  beforeEach(() => {
    cy.openAepp();
  });

  afterEach(() => {
    cy.visit('/');
  });

  if (Cypress.browser.family === 'chromium' && Cypress.browser.isHeaded) {
    it('Find wallet', () => {
      cy.get('[data-cy=wallet-found]').should('be.visible');
    });
    it('Connect to extension and get wallet info', () => {
      cy.get('[data-cy=wallet-address]')
        .should('be.visible')
        .should('contain', testAccount.publicKey)
        .get('[data-cy=wallet-balance]')
        .should('be.visible')
        .get('[data-cy=wallet-name]')
        .should('be.visible')
        .should('contain', 'Superhero');
    });
    it('Sign message', () => {
      cy.get('[data-cy=wallet-sign-msg]')
        .should('be.visible')
        .click()
        .get('[data-cy=message-valid]')
        .should('be.visible')
        .should('contain', messageSig);
    });
    it('Spend call', () => {
      cy.get('[data-cy=send]')
        .should('be.visible')
        .click()
        .get('[data-cy=send-res]')
        .should('be.visible')
        .invoke('text')
        .then(text => {
          const res = JSON.parse(text);
          res.should.be.a('Object');
          res.should.have.property('hash');
          res.should.have.property('tx');
          res.should.have.property('blockHash');
          res.should.have.property('rawTx');
        });
    });
    it('Contract call', () => {
      cy.get('[data-cy=contract-call]')
        .should('be.visible')
        .click()
        .get('[data-cy=contract-call-res]')
        .should('be.visible')
        .invoke('text')
        .then(text => {
          const res = JSON.parse(text);
          res.should.be.a('Object');
          res.should.have.property('hash');
          res.should.have.property('rawTx');
        });
    });
    it('Contract static call', () => {
      cy.get('[data-cy=contract-call-static]')
        .should('be.visible')
        .click()
        .get('[data-cy=contract-call-static-res]')
        .should('be.visible')
        .invoke('text')
        .then(text => {
          const res = JSON.parse(text);
          res.should.be.a('Object');
          res.should.have.property('hash');
          res.should.have.property('rawTx');
        });
    });
  }
});
