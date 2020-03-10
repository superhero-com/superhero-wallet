describe("Tests cases for notifications page and icon", () => {

  

  it("should have backup seed notification", () => {
    cy
    .login()
    .get('[data-cy=noti-count]')
    .should('be.visible')
    .should('contain',1)
  })

  it("click notification icon should open notifications page ", () => {
    cy
    .login()
    .get('[data-cy=noti]')
    .click()
    .urlEquals('/notifications')
  })

  it("should not have backup seed notification", () => {
    cy
    .login({ backupSeed: true })
    .get('[data-cy=noti-count]')
    .should('be.not.visible')
  })

  it("click notification icon should not open notifications page ", () => {
    cy
    .login({ backupSeed: true })
    .get('[data-cy=noti]')
    .click()
    .urlEquals('/account')
  })
})