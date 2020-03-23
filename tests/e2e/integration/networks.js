import { defaultNetworks, networks, DEFAULT_NETWORK } from '../../../src/popup/utils/constants';

const network = 'Testnet';
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
      .should('contain', network)
      .get('[data-cy=network-url]')
      .should('contain', defaultNetworks[network].url)
      .get('[data-cy=network-middleware]')
      .should('contain', defaultNetworks[network].middlewareUrl);
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
      .enterNetworkDetails(network, defaultNetworks[network].url, defaultNetworks[network].middlewareUrl)
      .get('[data-cy=connect]')
      .click()
      .buttonShouldBeDisabled('[data-cy=connect]')
      .get('[data-cy=error-msg]')
      .should('exist');
  });

  it("Can't add network with invalid urls", () => {
    cy.get('[data-cy=to-add]')
      .click()
      .enterNetworkDetails('test', 'test', 'test')
      .get('[data-cy=connect]')
      .click()
      .buttonShouldBeDisabled('[data-cy=connect]')
      .get('[data-cy=error-msg]')
      .should('exist');
  });

  it('Can add new network', () => {
    cy.addNetwork('Mainnet', networks[DEFAULT_NETWORK].url, networks[DEFAULT_NETWORK].middlewareUrl);
  });

  it('Can delete network', () => {
    cy.selectNetwork('Mainnet', networks[DEFAULT_NETWORK].url, networks[DEFAULT_NETWORK].middlewareUrl)
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
    cy.selectNetwork('Mainnet', networks[DEFAULT_NETWORK].url, networks[DEFAULT_NETWORK].middlewareUrl)
      .get('[data-cy=back-arrow]')
      .click()
      .get('.transactionList')
      .should('not.be.visible');
  });

  it("Can't add network with same name", () => {
    cy.selectNetwork('Mainnet', networks[DEFAULT_NETWORK].url, networks[DEFAULT_NETWORK].middlewareUrl)
      .get('[data-cy=to-add]')
      .click()
      .enterNetworkDetails('Mainnet', networks[DEFAULT_NETWORK].url, networks[DEFAULT_NETWORK].middlewareUrl)
      .get('[data-cy=connect]')
      .click()
      .buttonShouldBeDisabled('[data-cy=connect]');
  });

  it('Can edit network', () => {
    cy.selectNetwork('Mainnet', networks[DEFAULT_NETWORK].url, networks[DEFAULT_NETWORK].middlewareUrl)
      .get('[data-cy=more]')
      .click()
      .get('[data-cy=edit]')
      .should('be.visible')
      .click()
      .get('[data-cy=network] input')
      .should('have.value', 'Mainnet')
      .get('[data-cy=url] input')
      .should('have.value', networks[DEFAULT_NETWORK].url)
      .clear()
      .type(defaultNetworks[network].url)
      .get('[data-cy=middleware] input ')
      .should('have.value', networks[DEFAULT_NETWORK].middlewareUrl)
      .clear()
      .type(defaultNetworks[network].middlewareUrl)
      .get('[data-cy=connect]')
      .click()
      .get('[data-cy=network-url]')
      .eq(1)
      .should('contain', defaultNetworks[network].url)
      .get('[data-cy=network-middleware]')
      .eq(1)
      .should('contain', defaultNetworks[network].middlewareUrl)
      .get('[data-cy=back-arrow]')
      .click()
      .get('.transactionList')
      .should('be.visible');
  });
});
