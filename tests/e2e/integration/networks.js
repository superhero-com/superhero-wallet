process.env.NETWORK = 'Testnet';
const { defaultNetwork } = require('../../../src/popup/utils/constants');

describe('Test cases for networks page', () => {
  beforeEach(() => {
    cy.login().openNetworks();
  });

  it('Open networks page', () => {
    cy.get('[data-cy=to-add]')
      .should('be.visible')
      .get('[data-cy=networks]')
      .should('be.visible')
      .get('[data-cy=network-name]')
      .should('contain', defaultNetwork.name)
      .get('[data-cy=network-url]')
      .should('contain', defaultNetwork.url)
      .get('[data-cy=network-middleware]')
      .should('contain', defaultNetwork.middlewareUrl);
  });

  it('Can cancel add network', () => {
    cy.get('[data-cy=to-add]')
      .click()
      .get('[data-cy=cancel]')
      .should('be.visible')
      .click()
      .get('[data-cy=cancel]')
      .should('not.be.visible');
  });

  it("Can't add network with default network name", () => {
    cy.get('[data-cy=to-add]')
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
      .should('exist');
  });

  it("Can't add network with invalid urls", () => {
    cy.get('[data-cy=to-add]')
      .click()
      .enterNetworkDetails('test', 'test', 'test', 'test')
      .get('[data-cy=connect]')
      .click()
      .buttonShouldBeDisabled('[data-cy=connect]')
      .get('[data-cy=error-msg]')
      .should('exist');
  });

  it('Can add new network', () => {
    cy.addNetwork(
      'Mainnet',
      defaultNetwork.url,
      defaultNetwork.middlewareUrl,
      defaultNetwork.compilerUrl,
    );
  });

  it('Can delete network', () => {
    cy.selectNetwork(
      'Mainnet',
      defaultNetwork.url,
      defaultNetwork.middlewareUrl,
      defaultNetwork.compilerUrl,
    )
      .get('[data-cy=more]')
      .click()
      .get('[data-cy=delete]')
      .should('be.visible')
      .click()
      .get('[data-cy=networks]')
      .children()
      .should('have.length', 2)
      .get('[data-cy=networks] .network-row')
      .eq(0)
      .find('.checkmark')
      .should('have.class', 'checked');
  });

  it('Can select network', () => {
    cy.selectNetwork(
      'Mainnet',
      defaultNetwork.url,
      defaultNetwork.middlewareUrl,
      defaultNetwork.compilerUrl,
    )
      .goBack()
      .get('.transactionList')
      .should('not.be.visible');
  });

  it("Can't add network with same name", () => {
    cy.selectNetwork(
      'Mainnet',
      defaultNetwork.url,
      defaultNetwork.middlewareUrl,
      defaultNetwork.compilerUrl,
    )
      .get('[data-cy=to-add]')
      .click()
      .enterNetworkDetails(
        'Mainnet',
        defaultNetwork.url,
        defaultNetwork.middlewareUrl,
        defaultNetwork.compilerUrl,
      )
      .get('[data-cy=connect]')
      .click()
      .buttonShouldBeDisabled('[data-cy=connect]');
  });

  it('Can edit network', () => {
    cy.selectNetwork(
      'Mainnet',
      defaultNetwork.url,
      defaultNetwork.middlewareUrl,
      defaultNetwork.compilerUrl,
    )
      .get('[data-cy=more]')
      .click()
      .get('[data-cy=edit]')
      .should('be.visible')
      .click()
      .get('[data-cy=network] input')
      .should('have.value', 'Mainnet')
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
      .eq(1)
      .should('contain', defaultNetwork.url)
      .get('[data-cy=network-middleware]')
      .eq(1)
      .should('contain', defaultNetwork.middlewareUrl)
      .goBack()
      .get('.transactionList')
      .should('be.visible');
  });
});
