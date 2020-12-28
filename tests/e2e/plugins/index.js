const path = require('path');
const wp = require('@cypress/webpack-preprocessor');

module.exports = (on, config) => {
  const options = {
    webpackOptions: {
      resolve: {
        extensions: ['.js'],
      },
      module: {
        rules: [
          {
            test: /\.js?$/,
            loader: 'babel-loader',
          },
        ],
      },
    },
  };
  on('file:preprocessor', wp(options));
  on('before:browser:launch', (browser, args) => {
    if (browser.family === 'chromium' && browser.isHeaded) {
      const extensionFolder = path.resolve(__dirname, '..', '..', '..', 'dist', 'extension');
      args.extensions.push(extensionFolder);
    }

    return args;
  });

  return {
    ...config,
    fixturesFolder: 'tests/e2e/fixtures',
    integrationFolder: 'tests/e2e/integration',
    screenshotsFolder: 'tests/e2e/screenshots',
    videosFolder: 'tests/e2e/videos',
    supportFile: 'tests/e2e/support/index.js',
  };
};
