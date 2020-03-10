import { mnemonicToSeed } from '@aeternity/bip39';
import '../../../src/lib/initPolyfills';
import { setPendingTx, formatDate, mockLogin } from '../../../src/popup/utils'
import { testAccount } from '../../../src/popup/utils/config'

// Cypress.Commands.overwrite('visit', (orig, url, options) => {
//   url = `popup/popup${url}`
//   return orig(url, options)
// })

Cypress.Commands.add('openPopup', (onBeforeLoad) => {
  cy.visit('chrome/popup/popup', { onBeforeLoad })
})

Cypress.Commands.add('termsAgree', () => {
  cy
  .get('[data-cy=checkbox]')
  .click()
})

Cypress.Commands.add('openGenerateWallet', () => {
  cy
  .termsAgree()
  .get('[data-cy=generate-wallet]')
  .click()
})

Cypress.Commands.add('openImportWallet', () => {
  cy
  .termsAgree()
  .get('[data-cy=import-wallet]')
  .click()
})

Cypress.Commands.add('openTerms', () => {
  cy
  .get('[data-cy=terms]')
  .should('be.visible')
  .click()
})

Cypress.Commands.add('enterSeedPhrase', (seed) => {
  cy
  .openImportWallet()
  .get('textarea')
  .type(seed)
  .get('[data-cy=import]')
  .click()
})

Cypress.Commands.add('inputShouldHaveError', (input) => {
  cy
  .get(input)
  .should('have.class','has-error')
})

Cypress.Commands.add('buttonShouldBeDisabled', (button) => {
  cy
  .get(button)
  .should('have.class','disabled')
})

Cypress.Commands.add('buttonShouldNotBeDisabled', (button) => {
  cy
  .get(button)
  .should('not.have.class','disabled')
})

Cypress.Commands.add('shouldHasErrorMessage', (el) => {
  cy
  .get(el)
  .should('exist')
  .should('be.visible')
})

Cypress.Commands.add('onboardingSlideShouldBeActive', (slide) => {
  cy
  .get('[data-cy=onboarding-steps]')
  .find('ul li')
  .eq(slide)
  .should('have.class','current')
})

Cypress.Commands.add('clickDotNavigationMakeSlideActive', (slide) => {
  cy
  .get('[data-cy=onboarding-steps]')
  .find('ul li')
  .eq(slide)
  .click()
  .onboardingSlideShouldBeActive(slide)
})


Cypress.Commands.add('toggleAccordionItem', (item) => {
  cy
  .get('[data-cy=accordion-item]')
  .eq(item)
  .click()
})

Cypress.Commands.add('accordionItemShould', (item, cond) => {
  cy
  .get('[data-cy=accordion-item-content]')
  .eq(item)
  .should(cond)
  .get('[data-cy=accordion-item]')
  .eq(item)
  .find('[data-cy=accordion-item-open]')
  .should(cond)
});




Cypress.Commands.add('login', (options = { balance:10 }) => {
  cy
  .openPopup((win) => mockLogin(options))
});

Cypress.Commands.add('shouldRedirect', (url, to) => {
  cy
  .visit(`chrome/popup/popup#${url}`)
  .url()
  .should('eq',`${Cypress.config().popupUrl}/popup#${to}`)
})


Cypress.Commands.add('openMenu', () => {
  cy
  .get('[data-cy=hamburger]')
  .click()
})

Cypress.Commands.add('closeMenu', (from = 'button') => {
  if(from === 'button') {
    cy
    .get('[data-cy=close-menu]')
    .should('be.visible')
    .click()
  } else if(from === 'overlay') {
    cy
    .get('[data-cy=menu-overlay]')
    .should('be.visible')
    .click('left')
  }
})

Cypress.Commands.add('menuShould', (cond) => {
  cy
  .get('[data-cy=sidebar-menu]')
  .should(cond)
  .get('[data-cy=close-menu]')
  .should(cond)
})

Cypress.Commands.add('openMenuPage', (page, dropdown = false) => {
  cy
  .openMenu()
  if(dropdown) {
    cy.toggleDropdown()
  }
  cy
  .get(`[data-cy=${page}]`)
  .click()
  .url()
  .should('eq', `${Cypress.config().popupUrl}/popup#/${page}`)
  .menuShould('not.be.visible')
})

Cypress.Commands.add('toggleDropdown', () => {
  cy
  .get('[data-cy=settings]')
  .click()
  .get('[data-cy=dropdown]')
})

Cypress.Commands.add('dropdownShould', (cond) => {
  cy
  .get('[data-cy=dropdown]')
  .should(cond)
})

Cypress.Commands.add('openTip', () => {
  cy
  .get('[data-cy=tip-button]')
  .should('be.visible')
  .click()
  .get('[data-cy=tip-container]')
  .should('be.visible')
})

Cypress.Commands.add('openWithdraw', () => {
  cy
  .get('[data-cy=hamburger]')
  .click()
  .menuShould('be.visible')
  .get('[data-cy=send]')
  .click()
})


Cypress.Commands.add('enterTipDetails', ({ url = '', amount = null, note = '' }) => {
  cy.get('[data-cy=input-number]').clear()
  if(amount || amount === 0) {
    cy.get('[data-cy=input-number]').type(amount)
  }

  cy.get('[data-cy=textarea]').clear()
  if(note) cy.get('[data-cy=textarea]').type(note)

  if(url) {
    cy
    .get('[data-cy=edit-url]')
    .click()
    .get('[data-cy=input]')
    .clear()
    .type(url)
    .get('[data-cy=confirm-url]')
    .click()
  }
})

Cypress.Commands.add('toConfirmTip', (tip = {}) => {
  if(!tip.onTip) cy.openTip()
  cy
  .enterTipDetails({ ...tip })
  .buttonShouldNotBeDisabled('[data-cy=send-tip]')
  .get('[data-cy=send-tip]')
  .click()
  .get('[data-cy=confirm-tip]')
  .should('be.visible')
  .buttonShouldNotBeDisabled('[data-cy=confirm-tip]')
  .get('[data-cy=tip-amount]')
  .should('contain', tip.amount)
  .get('[data-cy=tip-url]')
  .should('contain', tip.url)
  .get('[data-cy=tip-note]')
  .should('contain', tip.note)
})

Cypress.Commands.add('sendTip', (tip = {}) => {
  cy
  .toConfirmTip({ ...tip })
  .get('[data-cy=confirm-tip]')
  .click()
  .get('[data-cy=balance-info]')
  .should('be.visible')
  .url()
  .should('eq', `${Cypress.config().popupUrl}/popup#/account`)
  .get('[data-cy=pending-txs]')
  .should('be.visible')
  .get('[data-cy=success-tip]')
  .should('be.visible')
  .url()
  .should('eq', `${Cypress.config().popupUrl}/popup#/success-tip`)
  .get('[data-cy=tip-amount]')
  .should('contain',tip.amount)
  .get('[data-cy=tip-url]')
  .should('contain',tip.url)
})

Cypress.Commands.add('pendingTx', (tx = {}) => {
  const txItem = cy.get('[data-cy=pending-txs] li').eq(0)
  txItem.find('[data-cy=amount]').should('contain',tx.amount)
  txItem.find('[data-cy=status]').should('contain','Pending')
  if(tx.url) txItem.find('[data-cy=url]').should('contain',tx.url)
  if(tx.time) txItem.find('[data-cy=time]').should('contain',formatDate(tx.time))
})

Cypress.Commands.add('enterAmountSend', (amount = 0) => {
  cy
  .get('[data-cy=input-number]')
  .clear()
  .type(amount)
  .wait(1000)
})


Cypress.Commands.add('goBack', (amount = 0) => {
  cy
  .get('[data-cy=back-arrow]')
  .click()
})

Cypress.Commands.add('enterAddress', (address) => {
  cy
  .get('[data-cy=address]')
  .clear()
  .type(address)
  .wait(1000)
})

Cypress.Commands.add('storageSet', (key, value) => {
  return new Cypress.Promise(async (resolve, reject) => {
    await browser.storage.local.set({ [key]: value })
    resolve()
  })
})


Cypress.Commands.add('setPendingTx', (tx) => {
  return new Cypress.Promise(async (resolve, reject) => {
    await setPendingTx(tx)
    resolve()
  })
})

Cypress.Commands.add('urlEquals', (route) => {
  cy
  .url()
  .should('eq', `${Cypress.config().popupUrl}/popup#${route}`)
})
