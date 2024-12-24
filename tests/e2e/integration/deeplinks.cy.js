import { tg } from '@/popup/plugins/i18n';
import { AE_NETWORK_TESTNET_ID } from '@/protocols/aeternity/config';
import { STUB_ACCOUNT, STUB_TX_BASE_64 } from '@/constants/stubs';

const callbackUrl = encodeURIComponent('http://localhost');
const encodedContractCallTx = encodeURIComponent('tx_+HQrAaEBbLQV9y00r/WCZ4XWrEVDpdiLPiLx2282rdKA1dkRTlmCA7yhBWuJbvnfcBIKpR/IbC+ywuM9P7fvmDFNerFKykCB+M1qA4al2v8FcAAAhzcV8VZnVACDGBf4hDuaygCQKxEV1igBG2+HI4byb8D/wPOLADU=');
const encodedUnknownTx = encodeURIComponent('tx_+FKB/wGhAcqjxWnZkJOLBrcg4qrqLAGciiTZoXqyjoYXlSBGEywioQHKo8Vp2ZCTiwa3IOKq6iwBnIok2aF6so6GF5UgRhMsIguGDyb1YcgAABOAFw87cw==');
const message = 'This is a test message! http://localhost';
const hexMessage = '5468697320697320612074657374206d6573736167652120687474703a2f2f6c6f63616c686f7374';
const callbackParams = `x-success=${callbackUrl}&x-cancel=${callbackUrl}`;
const encodedJWTPayload = encodeURIComponent('{"a":1,"b":2}');
const signedJWT = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoxLCJiIjoyLCJzdWJfandrIjp7ImNydiI6IkVkMjU1MTkiLCJrdHkiOiJPS1AiLCJ4IjoiM0NneVdoMnRkWnFzNEJKVnliX29LRTNoSzgxb1l6dGVXRUtuamZaU1oyYyJ9fQ.BxbRGRRmA6OKHn9OdGuJRpGlWnZOurVJi8riFlqHXBFYidOT00EmBlGYctKY7WwW2pBNwwoaBlmavCq8Y96UDQ';
// used to test the signing
const encodedTestDeploymentUrl = encodeURIComponent('http://localhost:8080');

describe('Test cases for deeplinks', () => {
  it('Signs transaction and verifies signature', () => {
    cy.login(
      {},
      `/sign-transaction?transaction=${encodeURIComponent(STUB_TX_BASE_64)}&networkId=ae_uat`
      + `&x-success=${encodedTestDeploymentUrl}%2Faccount%3F%7Btransaction%7D`
      + `&x-cancel=${encodedTestDeploymentUrl}`,
    )
      .get('[data-cy=label]')
      .eq(0)
      .should('be.visible')
      .should('contain', tg('transaction.type.spendTx'))
      .get('[data-cy=label]')
      .eq(1)
      .should('be.visible')
      .should('contain', tg('transaction.spendType.in'))
      .splittedStringToBeEqual('[data-cy=sender] [data-cy=address]', 'ak_2YFAH6kk1ZqTJcAtp7fupGqP9gK8KfPmQVCUuM4gSmzMSczaGc')
      .splittedStringToBeEqual('[data-cy=recipient] [data-cy=address]', 'ak_2YFAH6kk1ZqTJcAtp7fupGqP9gK8KfPmQVCUuM4gSmzMSczaGc')
      .get('[data-cy=accept]')
      .click()
      .url()
      .should('not.contain', '/sign-transaction')
      .url()
      .then((url) => {
        expect(url.split('?')[1]).to.equal('tx_%2BJsLAfhCuECWzpMfRK1jZkRzF9%2BO%2BkLl8IkeJmTsDc2KKATrF745bg91rWb3l0HcS3ks6DKgtwvLWgg5%2BPiJ1gQpgF1yYlgLuFP4UQwBoQHKo8Vp2ZCTiwa3IOKq6iwBnIok2aF6so6GF5UgRhMsIqEByqPFadmQk4sGtyDiquosAZyKJNmherKOhheVIEYTLCILhg8m9WHIAAATgHk6x1k%3D');
      });
  });

  it('Signs transaction and replaces caller', () => {
    cy.login({}, `/sign-transaction?transaction=${encodedContractCallTx}&networkId=ae_uat&${callbackParams}`)
      .get('[data-cy=sender-replaced-warning]')
      .should('not.exist')
      .splittedStringToBeEqual('[data-cy=sender] [data-cy=address]', 'ak_psgfxY4VcnJBTTshx2amBFf397ryoPKTTXyAcrx7BxVAVbt1W');

    cy.login({}, `/sign-transaction?transaction=${encodedContractCallTx}&networkId=ae_uat&replace-caller=true&${callbackParams}`)
      .get('[data-cy=sender-replaced-warning]')
      .should('be.visible')
      .splittedStringToBeEqual('[data-cy=sender] [data-cy=address]', STUB_ACCOUNT.addressAeternity);
  });

  it('Signs transaction of unsupported type', () => {
    cy.login({}, `/sign-transaction?transaction=${encodedUnknownTx}&networkId=ae_uat&${callbackParams}`)
      .get('[data-cy=label]')
      .should('be.visible')
      .should('contain', tg('modals.confirm-raw-sign.title'))
      .get('[data-cy=warning]')
      .should('be.visible')
      .get('[data-cy=popup-aex2] > .container')
      .scrollTo('bottom')
      .get('[data-cy=data]')
      .should('be.visible')
      .should('contain', decodeURIComponent(encodedUnknownTx));
  });

  it('Signs transaction with wrong networkId', () => {
    cy.login({}, `/sign-transaction?transaction=${encodeURIComponent(STUB_TX_BASE_64)}&networkId=ae_mainnet&${callbackParams}`)
      .get('[data-cy=message]')
      .should('be.visible')
      .should('contain', tg('modals.wrongNetwork.msg', ['ae_mainnet']));
  });

  it('Signs message as unencoded string and hex, verifies that signatures equal', () => {
    let messageSignature;

    cy.login(
      {},
      `/sign-message?message=${hexMessage}&encoding=hex&`
      + `&x-success=${encodedTestDeploymentUrl}%2Faccount%3F%7Bsignature%7D`
      + `&x-cancel=${encodedTestDeploymentUrl}`,
    )
      .get('[data-cy=label]')
      .should('be.visible')
      .should('contain', tg('pages.popupMessageSign.title'))
      .get('[data-cy=message]')
      .should('be.visible')
      .should('contain', message)
      .get('[data-cy=accept]')
      .click()
      .url()
      .should('not.contain', '/sign-message')
      .url()
      .then((url) => {
        [, messageSignature] = url.split('?');
        expect(!!messageSignature).to.equal(true);
      });

    cy.login(
      {},
      `/sign-message?message=${encodeURIComponent(message)}`
      + `&x-success=${encodedTestDeploymentUrl}%2Faccount%3F%7Bsignature%7D`
      + `&x-cancel=${encodedTestDeploymentUrl}`,
    )
      .get('[data-cy=message]')
      .should('be.visible')
      .should('contain', message)
      .get('[data-cy=accept]')
      .click()
      .url()
      .should('not.contain', '/sign-message')
      .url()
      .then((url) => {
        expect(url.split('?')[1]).to.equal(messageSignature);
      });
  });

  it('Connects to dapp, and return address and networkId', () => {
    cy.login(
      {},
      '/address?'
      + `x-success=${encodedTestDeploymentUrl}%2Faccount%3F%7Baddress%7D%26%7BnetworkId%7D`
      + `&x-cancel=${encodedTestDeploymentUrl}`,
    )
      .get('[data-cy=page-header]')
      .should('be.visible')
      .should('contain', tg('pages.connectConfirm.title'))
      .click()
      .get('[data-cy=accept]')
      .click()
      .url()
      .should('not.contain', '/address')
      .url()
      .then((url) => {
        expect(url.split('?')[1].split('&')[0]).to.equal(STUB_ACCOUNT.addressAeternity);
        expect(url.split('&')[1]).to.equal(AE_NETWORK_TESTNET_ID);
      });
  });

  it('JWT signing and verifying signature', () => {
    cy.login(
      {},
      `/sign-jwt?payload=${encodedJWTPayload}`
      + `&x-success=${encodedTestDeploymentUrl}%2Faccount%3F%7Bsigned-payload%7D`
      + `&x-cancel=${encodedTestDeploymentUrl}`,
    )
      .get('[data-cy=label]')
      .should('be.visible')
      .should('contain', tg('modals.confirmUnsafeSign.title'))
      .get('[data-cy=warning]')
      .should('contain', tg('modals.confirmUnsafeSign.warning'))
      .get('[data-cy=aepp]')
      .should('contain', `localhost:8080 ${tg('modals.confirmUnsafeSign.heading')}`)
      .get('[data-cy=message]')
      .should('be.visible')
      .should('contain', '{"a":1,"b":2,"sub_jwk":{"kty":"OKP","crv":"Ed25519","x":"3CgyWh2tdZqs4BJVyb_oKE3hK81oYzteWEKnjfZSZ2c"}}')
      .get('[data-cy=accept]')
      .click()
      .url()
      .should('not.contain', '/sign-jwt')
      .url()
      .then((url) => {
        expect(url.split('?')[1]).to.equal(signedJWT);
      });
  });

  it('JWT signing from superhero', () => {
    cy.login({}, '/sign-jwt?payload=%7B%22a%22%3A1%2C%22b%22%3A2%7D&x-success=https%3A%2F%2Fchat.superhero.com&x-cancel=https%3A%2F%2Fchat.superhero.com')
      .get('[data-cy=label]')
      .eq(0)
      .should('be.visible')
      .should('contain', tg('modals.confirmTransactionSign.superheroChat'))
      .get('[data-cy=warning]')
      .should('not.exist')
      .get('[data-cy=aepp]')
      .should('contain', `${tg('modals.confirmTransactionSign.superheroChat')} chat.superhero.com ${tg('modals.confirmUnsafeSign.superheroChatJwtSign')}`)
      .get('[data-cy=message]')
      .should('be.visible')
      .should('contain', '{"a":1,"b":2,"sub_jwk":{"kty":"OKP","crv":"Ed25519","x":"3CgyWh2tdZqs4BJVyb_oKE3hK81oYzteWEKnjfZSZ2c"}}');
  });

  // Works with superhero.com only
  it('Tips deeplink', () => {
    cy.login({}, `/tips?url=${callbackUrl}&x-success=https%3A%2F%2Fsuperhero.com&x-cancel=https%3A%2F%2Fsuperhero.com`)
      .get('[data-cy=address] [data-cy=textarea]')
      .should('have.attr', 'placeholder', tg('modals.send.recipientPlaceholderUrl'))
      .get('[data-cy=address] [data-cy=textarea]')
      .type('hello.com')
      .get('[data-cy=address] + .status .title')
      .should('contain', tg('modals.not-verified.title'));

    cy.login({}, `/tips?url=${callbackUrl}&${callbackParams}`)
      .get('.modal')
      .should('not.exist');
  });

  // TODO: retip, comment
});
