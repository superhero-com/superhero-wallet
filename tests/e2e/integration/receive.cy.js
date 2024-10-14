import { STUB_ACCOUNT, STUB_TOKEN_CONTRACT_ADDRESS } from '@/constants/stubs';

const testAmount = 111.11;

describe('Test cases for receive modal', () => {
  it('Generates, copies and opens a qr code for each blockchain', () => {
    // aeternity

    cy.login()
      .generateReceiveLinkAndVisit(STUB_ACCOUNT.addressAeternity, testAmount);

    // aeternity fungibleToken as asset

    cy.login()
      .generateReceiveLinkAndVisit(
        STUB_ACCOUNT.addressAeternity,
        testAmount,
        {
          contractId: STUB_TOKEN_CONTRACT_ADDRESS,
          name: 'AMAZING',
        },
      );

    // bitcoin

    cy.get('[data-cy=bullet-switcher-add]')
      .click()
      .get('[data-cy=account-card-add]')
      .click()
      .get('.button-subheader ')
      .eq(1)
      .click()
      .get('[data-cy=create-plain-account]')
      .click()
      .generateReceiveLinkAndVisit(STUB_ACCOUNT.addressBitcoinTestnet, testAmount);

    // ethereum

    cy.get('[data-cy=bullet-switcher-add]')
      .click()
      .get('[data-cy=account-card-add]')
      .click()
      .get('.button-subheader ')
      .eq(2)
      .click()
      .get('[data-cy=create-plain-account]')
      .click()
      .generateReceiveLinkAndVisit(STUB_ACCOUNT.addressEthereum, testAmount);
  });
});
