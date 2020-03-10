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
    it(`should not redirect to last visited route ${url}`, () => {
      cy
      .login({ lastRoute:url })
      .urlEquals('/account')
    })
  })

  redirectRoutes.forEach((url) => {
    it(`should redirect to last visited route ${url}`, () => {
      cy
      .login({ lastRoute:url })
      .urlEquals(url)
    })
  })

  txs.forEach(tx => {
    it("should show pending tx", () => {
      cy
      .setPendingTx(tx)
      .login()
    })
  })

})