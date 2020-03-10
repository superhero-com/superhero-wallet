describe("Test cases for Account Page" , () => {
    beforeEach(() => {
        cy.login()
    })

    // it("Check if button for seed phrase backup disappear", () => {
    //     cy
    //     .wait(2000)
    //     .get('[data-cy=seed-notif]')
    //     .should('not.be.visible')
    // })
    
    // it("Sidebar open and close", () => {
    //     cy
    //     .openMenu()
    //     .menuShould('be.visible')
    //     .closeMenu()
    //     .menuShould('not.be.visible')
    // })

    it("Check copy button", () => {
        cy
        .get('[data-cy=copy]')
        .click()
        .get('.copied-alert')
        .should('contain','Copied!')
    })

    it("Check How-to-claim Button", () => {
        cy
        .get('[data-cy=how-to-claim-button]')
        .should('be.visible')
        .click()
    })

    it("Check Claim-Name Button And Back to Account", () => {
        cy
        .get('[data-cy="account-name"]')
        .should('be.visible')
        .click()
        .get('[data-cy=names-container]')
        .should('be.visible')
        .get('[data-cy="back-arrow"]')
        .click()
        .get('[data-cy=how-to-claim-button]')
        .should('be.visible')
    })


    it("Check Tip Button And Back to Account", () => {
        cy
        .get('[data-cy=tip-button]')
        .should('be.visible')
        .click()
        .get('[data-cy=tip-container]')
        .should('be.visible')
        .get('[data-cy="back-arrow"]')
        .click()
        .get('[data-cy=how-to-claim-button]')
        .should('be.visible')
    })

    it("Check View-All-Transactions Button And Back to Account", () => {
        cy
        .get('[data-cy=view-all-transactions]')
        .should('be.visible')
        .click()
        .get('ul.allTransactions')
        .should('be.visible')
        .get('[data-cy="back-arrow"]')
        .click()
        .get('[data-cy=how-to-claim-button]')
        .should('be.visible')
    })

})
    