import { NETWORK_TESTNET } from '../../../src/constants';

describe('Test cases for networks page', () => {
  it('Opens network page, cancels/adds network, can not add network with default name/invalid url', () => {
    cy.login()
      .openNetworks()
      .getByTestId('networks')
      .should('be.visible')
      .getByTestId('network-name')
      .should('contain', NETWORK_TESTNET.name)
      .getByTestId('network-url')
      .should('contain', NETWORK_TESTNET.url)
      .getByTestId('network-middleware')
      .should('contain', NETWORK_TESTNET.middlewareUrl)

      .getByTestId('to-add')
      .click()
      .enterNetworkDetails(
        NETWORK_TESTNET.name,
        NETWORK_TESTNET.url,
        NETWORK_TESTNET.middlewareUrl,
        NETWORK_TESTNET.compilerUrl,
      )
      .getByTestId('connect')
      .buttonShouldBeDisabled('[data-cy=connect]')
      .getByTestId('input-message')
      .should('exist')

      .enterNetworkDetails('test', 'test', 'test', 'test')
      .buttonShouldBeDisabled('[data-cy=connect]')
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
        NETWORK_TESTNET.url,
        NETWORK_TESTNET.middlewareUrl,
        NETWORK_TESTNET.compilerUrl,
      )
      .getByTestId('network-edit')
      .should('be.visible')
      .click()
      .getInputByTestId('network')
      .should('have.value', 'NewNetwork')
      .getInputByTestId('url')
      .should('have.value', NETWORK_TESTNET.url)
      .clear()
      .type(NETWORK_TESTNET.url)
      .getInputByTestId('middleware')
      .should('have.value', NETWORK_TESTNET.middlewareUrl)
      .clear()
      .type(NETWORK_TESTNET.middlewareUrl)
      .getByTestId('connect')
      .click()
      .getByTestId('network-url')
      .eq(-1)
      .should('contain', NETWORK_TESTNET.url)
      .getByTestId('network-middleware')
      .eq(-1)
      .should('contain', NETWORK_TESTNET.middlewareUrl)
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
        NETWORK_TESTNET.url,
        NETWORK_TESTNET.middlewareUrl,
        NETWORK_TESTNET.compilerUrl,
      )
      .buttonShouldBeDisabled('[data-cy=connect]')
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
