import { NETWORK_NAME_MAINNET } from '../../../src/constants/common';
import { AE_NETWORK_DEFAULT_SETTINGS } from '../../../src/protocols/aeternity/config';

const aeNetworkSettingsTestnet = AE_NETWORK_DEFAULT_SETTINGS.testnet;

describe('Test cases for networks page', () => {
  it('Opens network page, cancels/adds network, can not add network with default name/invalid url', () => {
    cy.login()
      .openNetworks()
      .getByTestId('networks')
      .should('be.visible')
      .getByTestId('network-name')
      .should('contain', NETWORK_NAME_MAINNET)

      // Test if it possible to add already existing default network (mainnet)
      .getByTestId('to-add')
      .click()
      .enterNetworkDetails(
        NETWORK_NAME_MAINNET,
        aeNetworkSettingsTestnet.nodeUrl,
        aeNetworkSettingsTestnet.middlewareUrl,
        aeNetworkSettingsTestnet.compilerUrl,
      )
      .buttonShouldBeDisabled('[data-cy=btn-add-network]')
      .getByTestId('input-message')
      .should('exist')

      // Test if it's possible to add network with invalid URLs
      .enterNetworkDetails('test', 'test', 'test', 'test')
      .buttonShouldBeDisabled('[data-cy=btn-add-network]')
      .getByTestId('input-message')
      .should('exist')

      .getByTestId('cancel')
      .should('be.visible')
      .click()
      .urlEquals('/more/settings/networks');
  });

  it('Can add, select, edit, delete new network, can not add network with the same name', () => {
    cy.login()
      .openNetworks()
      .addNetwork(
        'NewNetwork',
        aeNetworkSettingsTestnet.nodeUrl,
        aeNetworkSettingsTestnet.middlewareUrl,
        aeNetworkSettingsTestnet.compilerUrl,
      )
      .getByTestId('network-edit')
      .should('be.visible')
      .click()
      .getInputByTestId('network-name')
      .should('have.value', 'NewNetwork')
      .getInputByTestId('ae-node-url')
      .should('have.value', aeNetworkSettingsTestnet.url)
      .clear()
      .type(aeNetworkSettingsTestnet.url)
      .getInputByTestId('ae-middleware-url')
      .should('have.value', aeNetworkSettingsTestnet.middlewareUrl)
      .clear()
      .type(aeNetworkSettingsTestnet.middlewareUrl)
      .getByTestId('btn-add-network')
      .click()
      .getByTestId('network-url')
      .eq(-1)
      .should('contain', aeNetworkSettingsTestnet.nodeUrl)
      .getByTestId('network-middleware')
      .eq(-1)
      .should('contain', aeNetworkSettingsTestnet.middlewareUrl)
      .goBack()
      .goBack()
      .goBack()
      .getByTestId('account-card-base')
      .should('exist')

      .openNetworks()
      .get('[data-cy=to-add]')
      .click()
      .enterNetworkDetails(
        'NewNetwork',
        aeNetworkSettingsTestnet.nodeUrl,
        aeNetworkSettingsTestnet.middlewareUrl,
        aeNetworkSettingsTestnet.compilerUrl,
      )
      .buttonShouldBeDisabled('[data-cy=btn-add-network]')
      .getByTestId('input-message')
      .should('exist')
      .getByTestId('cancel')
      .click()

      .getByTestId('network-delete')
      .should('be.visible')
      .click()
      .get('[data-cy=networks] .network-row')
      .should('have.length', 2)
      .get('[data-cy=networks] .network-row')
      .eq(0)
      .find('.radio-dot')
      .should('have.class', 'checked');
  });
});
