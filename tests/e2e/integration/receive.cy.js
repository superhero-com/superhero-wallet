import { STUB_ACCOUNT, STUB_TOKEN_CONTRACT_ADDRESS } from '@/constants/stubs';
import { AE_NETWORK_DEFAULT_SETTINGS } from '../../../src/protocols/aeternity/config';

const testAmount = 111.11;

describe('Test cases for receive modal', () => {
  it('Generates, copies and opens a qr code for each blockchain', () => {
    // aeternity

    cy.login()
      .generateReceiveLinkAndVisit(STUB_ACCOUNT.addressAeternity, testAmount);

    // aeternity fungibleToken as asset

    cy.request(`${AE_NETWORK_DEFAULT_SETTINGS.testnet.middlewareUrl}/v3/aex9/${STUB_TOKEN_CONTRACT_ADDRESS}`).then((response) => {
      const tokenSymbol = response.body.symbol;

      cy.login()
        .generateReceiveLinkAndVisit(
          STUB_ACCOUNT.addressAeternity,
          testAmount,
          {
            contractId: STUB_TOKEN_CONTRACT_ADDRESS,
            name: tokenSymbol,
          },
        );
    });

    // bitcoin

    cy.get('[data-cy=bullet-switcher-add]')
      .click()
      .get('[data-cy=account-card-add]')
      .click()
      .get('.button-subheader ')
      .eq(0)
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
      .eq(1)
      .click()
      .get('[data-cy=create-plain-account]')
      .click()
      .generateReceiveLinkAndVisit(STUB_ACCOUNT.addressEthereum, testAmount);
  });
});
