const path = require('path')
module.exports = (on, config) => {

  on('before:browser:launch', (browser, args) => {
    if (browser.family === 'chromium' && browser.isHeaded) {
      const extensionFolder = path.resolve(__dirname, '..', '..','..', 'dist/extension')
      args.extensions.push(extensionFolder)
    }

    return args
  })

  return Object.assign({}, config, {
    fixturesFolder: 'tests/e2e/fixtures',
    integrationFolder: 'tests/e2e/integration',
    screenshotsFolder: 'tests/e2e/screenshots',
    videosFolder: 'tests/e2e/videos',
    supportFile: 'tests/e2e/support/index.js',
  })
};
