import { noRedirectRoutes } from '../../../src/popup/utils/config';

const redirectRoutes = [
  '/tip',
  '/receive',
  '/send',
  '/names',
  '/aboutSettings',
  '/transactions'
]

const txs = [
  { hash: '', amount: 0.1, domain: 'localhost:5000', time: Date.now(), type: 'tip' },
  { hash: '', amount: 2, domain: 'localhost:8000', time: Date.now(), type: 'tip' },
  { hash: '', amount: 10, domain: 'localhost:8080', time: Date.now(), type: 'tip' },
]

describe("Tests cases not connected to specific page", () => {

  noRedirectRoutes.forEach((url) => {
    it(`No redirect to last visited route ${url}`, () => {
      cy
      .login({ lastRoute:url })
      .urlEquals('/account')
    })
  })

  redirectRoutes.forEach((url) => {
    it(`Redirect to last visited route ${url}`, () => {
      cy
      .login({ lastRoute:url })
      .urlEquals(url)
    })
  })

  txs.forEach(tx => {
    it("Show pending tx", () => {
      cy
      .setPendingTx(tx)
      .login()
    })
  })


  it("Connection message disappear", () => {
    cy
    .login()
    .get('[data-cy=connect-node]')
    .should('not.be.visible')
  })
})