import { mnemonicToSeed } from '@aeternity/bip39';
import '../../../src/lib/initPolyfills';

Cypress.Commands.overwrite('visit', (orig, url, options) => {
  url = `popup/popup${url}`
  return orig(url, options)
})

Cypress.Commands.add('openPopup', (onBeforeLoad) => {
  cy.visit('', { onBeforeLoad })
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




Cypress.Commands.add('login', (name = null) => {
  cy
  .openPopup((win) => {
    const mnemonic = "media view gym mystery all fault truck target envelope kit drop fade"
    const seed = mnemonicToSeed(mnemonic).toString('hex')
    const keypair = {
      publicKey:"ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5",
      privateKey: seed
    }
    browser.storage.local.set({ userAccount: keypair, isLogged: true, termsAgreed: true });
    const sub = [];
    sub.push({
      name: 'Main Account',
      publicKey: keypair.publicKey,
      balance: 0,
      root: true,
      aename: name,
    });
    browser.storage.local.set({ subaccounts: sub, activeAccount: 0 });
    browser.storage.local.set({ mnemonic: mnemonic });
  })
});

Cypress.Commands.add('shouldRedirect', (url, to) => {
  cy
  .visit(`#${url}`)
  .url()
  .should('eq',`${Cypress.config().baseUrl}popup/popup#${to}`)
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
  .should('eq', `${Cypress.config().baseUrl}popup/popup#/${page}`)
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