function getFixtureBlob(fileUrl, type) {
    return type === 'application/json'
      ? cy
          .fixture(fileUrl)
          .then(JSON.stringify)
          .then(jsonStr => new Blob([jsonStr], { type: 'application/json' }))
      : cy.fixture(fileUrl, 'base64').then(Cypress.Blob.base64StringToBlob)

}

Cypress.Commands.add('uploadFile', (selector, fileUrl, type = '') => {
    return cy.get(selector).then(subject => {
      return getFixtureBlob(fileUrl, type).then(blob => {
        return cy.window().then(win => {
          const el = subject[0]
          const nameSegments = fileUrl.split('/')
          const name = nameSegments[nameSegments.length - 1]
          const testFile = new win.File([blob], name, { type })
          const dataTransfer = new win.DataTransfer()
          dataTransfer.items.add(testFile)
          el.files = dataTransfer.files
          el.dispatchEvent(new Event('change', {bubbles: true}))
          return subject
        })
      })
    })
});