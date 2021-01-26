process.env.NETWORK = 'Testnet';
const { defaultNetwork } = require('../../../src/popup/utils/constants');

describe('Test cases for networks page', () => {
  beforeEach(() => {
    cy.login().openNetworks();
  });

  it('Opens network page, cancels/adds network, can not add network with default name/invalid url', () => {
    cy.get('[data-cy=networks]')
      .should('be.visible')
      .get('[data-cy=network-name]')
      .should('contain', defaultNetwork.name)
      .get('[data-cy=network-url]')
      .should('contain', defaultNetwork.url)
      .get('[data-cy=network-middleware]')
      .should('contain', defaultNetwork.middlewareUrl)

      .get('[data-cy=to-add]')
      .click()
      .enterNetworkDetails(
        defaultNetwork.name,
        defaultNetwork.url,
        defaultNetwork.middlewareUrl,
        defaultNetwork.compilerUrl,
      )
      .get('[data-cy=connect]')
      .click()
      .buttonShouldBeDisabled('[data-cy=connect]')
      .get('[data-cy=error-msg]')
      .should('exist')

      .enterNetworkDetails('test', 'test', 'test', 'test')
      .get('[data-cy=connect]')
      .click()
      .buttonShouldBeDisabled('[data-cy=connect]')
      .get('[data-cy=error-msg]')
      .should('exist')

      .get('[data-cy=cancel]')
      .should('be.visible')
      .click()
      .get('[data-cy=cancel]')
      .should('not.exist');
  });

  it('Can add, select, edit, delete new network, can not add network with the same name', () => {
    cy.addNetwork(
      'Newnetwork',
      defaultNetwork.url,
      defaultNetwork.middlewareUrl,
      defaultNetwork.compilerUrl,
    )

      .selectNetwork()
      .goBack()
      .goBack()
      .get('.transaction-list')
      .should('not.exist')

      .openNetworks()
      .get('[data-cy=more]')
      .click()
      .get('[data-cy=edit]')
      .should('be.visible')
      .click()
      .get('[data-cy=network] input')
      .should('have.value', 'Newnetwork')
      .get('[data-cy=url] input')
      .should('have.value', defaultNetwork.url)
      .clear()
      .type(defaultNetwork.url)
      .get('[data-cy=middleware] input ')
      .should('have.value', defaultNetwork.middlewareUrl)
      .clear()
      .type(defaultNetwork.middlewareUrl)
      .get('[data-cy=connect]')
      .click()
      .get('[data-cy=network-url]')
      .eq(2)
      .should('contain', defaultNetwork.url)
      .get('[data-cy=network-middleware]')
      .eq(2)
      .should('contain', defaultNetwork.middlewareUrl)
      .goBack()
      .goBack()
      .get('.transaction-list')
      .should('exist')

      .openNetworks()
      .get('[data-cy=to-add]')
      .click()
      .enterNetworkDetails(
        'Newnetwork',
        defaultNetwork.url,
        defaultNetwork.middlewareUrl,
        defaultNetwork.compilerUrl,
      )
      .get('[data-cy=connect]')
      .click()
      .buttonShouldBeDisabled('[data-cy=connect]')
      .get('[data-cy=cancel]')
      .click()

      .get('[data-cy=more]')
      .click()
      .get('[data-cy=delete]')
      .should('be.visible')
      .click()
      .get('[data-cy=networks] .network-row')
      .should('have.length', 2)
      .get('[data-cy=networks] .network-row')
      .eq(0)
      .find('.checkmark')
      .should('have.class', 'checked');
  });
});
