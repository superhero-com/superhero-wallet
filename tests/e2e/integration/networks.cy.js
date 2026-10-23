import { NETWORK_NAME_MAINNET } from '@/constants';
import { STUB_ACCOUNT } from '@/constants/stubs';
import { AE_NETWORK_DEFAULT_SETTINGS } from '@/protocols/aeternity/config';

const aeNetworkSettingsTestnet = AE_NETWORK_DEFAULT_SETTINGS.testnet;

function goBackTo(pathname) {
  cy.get('[data-cy=back-arrow]:visible')
    .click()
    .location('pathname')
    .should('eq', pathname);
}

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
      )
      .buttonShouldBeDisabled('[data-cy=btn-add-network]')
      .getByTestId('input-message')
      .should('exist')

      // Test if it's possible to add network with invalid URLs
      .enterNetworkDetails('test', 'test', 'test')
      .buttonShouldBeDisabled('[data-cy=btn-add-network]')
      .getByTestId('input-message')
      .should('exist')

      .getByTestId('cancel')
      .click()
      .urlEquals('/more/settings/networks');
  });

  it('Can add, rename while active and delete a network, can not add network with the same name', () => {
    const renamedNodeUrl = new URL('/renamed-node', Cypress.config('baseUrl')).href;

    // The renamed network's node is the testnet one, apart from the balance
    cy.intercept({ pathname: /^\/renamed-node\// }, (req) => {
      /* eslint-disable no-param-reassign */
      req.url = req.url.replace(renamedNodeUrl, aeNetworkSettingsTestnet.nodeUrl);
      req.headers.host = new URL(aeNetworkSettingsTestnet.nodeUrl).host;
      /* eslint-enable no-param-reassign */
    });
    cy.intercept({
      method: 'GET',
      pathname: `/renamed-node/v3/accounts/${STUB_ACCOUNT.addressAeternity}`,
    }, {
      headers: { 'content-type': 'application/json' },
      body: `{"id":"${STUB_ACCOUNT.addressAeternity}","balance":12500000000000000000,"nonce":0,"payable":true,"kind":"basic"}`,
    }).as('renamedNodeBalance');

    cy.login()
      .openNetworks()
      .addNetwork(
        'NewNetwork',
        aeNetworkSettingsTestnet.nodeUrl,
        aeNetworkSettingsTestnet.middlewareUrl,
      );
    // Adding a network switches to it
    cy.contains('[data-cy=networks] .network-row', 'NewNetwork')
      .should('have.class', 'checked');
    cy.contains('[data-cy=networks] .network-row', 'NewNetwork')
      .find('[data-cy=network-edit]')
      .click()
      .getInputByTestId('network-name')
      .should('have.value', 'NewNetwork')
      .clear({ scrollBehavior: 'center' })
      .type('Renamed', { scrollBehavior: 'center' })
      .get('[data-cy=group-aeternity] [data-cy=nodeUrl] input')
      .should('have.value', aeNetworkSettingsTestnet.nodeUrl)
      .clear({ scrollBehavior: 'center' })
      .type(renamedNodeUrl, { scrollBehavior: 'center' })
      .get('[data-cy=group-aeternity] [data-cy=middlewareUrl] input')
      .should('have.value', aeNetworkSettingsTestnet.middlewareUrl)
      .getByTestId('btn-add-network')
      .click()
      .get('[data-cy=networks] .network-row')
      .should('have.length', 3);
    cy.contains('[data-cy=networks] .network-row', 'Renamed')
      .should('have.class', 'checked')
      .should('contain', renamedNodeUrl);

    // The wallet keeps working on the renamed network's node
    goBackTo('/more/settings');
    goBackTo('/more');
    goBackTo('/account');
    cy.wait('@renamedNodeBalance')
      .get('[data-cy=balance-info]')
      .should('contain', '12.50');

    cy.openNetworks()
      .get('[data-cy=to-add]')
      .click()
      .enterNetworkDetails(
        'Renamed',
        aeNetworkSettingsTestnet.nodeUrl,
        aeNetworkSettingsTestnet.middlewareUrl,
      )
      .buttonShouldBeDisabled('[data-cy=btn-add-network]')
      .getByTestId('input-message')
      .should('exist')
      .getByTestId('cancel')
      .click();

    cy.contains('[data-cy=networks] .network-row', 'Renamed')
      .find('[data-cy=network-delete]')
      .click()
      .get('[data-cy=to-confirm]')
      .click()
      .get('[data-cy=networks] .network-row')
      .should('have.length', 2);
    // Deleting the active network switches to Mainnet
    cy.contains('[data-cy=networks] .network-row', NETWORK_NAME_MAINNET)
      .should('have.class', 'checked');
  });
});
