/* eslint-disable no-param-reassign */

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const commitHash = require('child_process').execSync('git rev-parse HEAD || echo dev').toString().trim();
const branchName = require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const EventHooksPlugin = require('event-hooks-webpack-plugin');
const fs = require('fs-extra');
const { version: sdkVersion } = require('./node_modules/@aeternity/aepp-sdk/package.json');

// eslint-disable-next-line camelcase
const { npm_package_version, PLATFORM, NODE_ENV } = process.env;

const parseBool = (val) => (val ? JSON.parse(val) : false);

/**
 * Remove string entries from array by modifying the initial array.
 * @param {string[]} arr
 * @param {string[]} values
 */
const removeArrEntries = (arr, values) => values.forEach(
  (val) => arr.splice(arr.findIndex((arrElem) => arrElem === val), 1),
);

const RUNNING_IN_TESTS = parseBool(process.env.RUNNING_IN_TESTS);
const UNFINISHED_FEATURES = parseBool(process.env.UNFINISHED_FEATURES);
const IS_FIREFOX_EXT = parseBool(process.env.IS_FIREFOX_EXT);

module.exports = {
  configureWebpack: {
    optimization: {
      splitChunks: {
        minSize: 200000,
        maxSize: 500000,
      },
    },
  },
  publicPath: { web: '/', extension: '../' }[PLATFORM] || './',
  outputDir: {
    extension: IS_FIREFOX_EXT ? 'dist/extension/firefox' : 'dist/extension/chrome',
    ionic: 'www',
    web: 'dist/web/root',
  }[PLATFORM],
  productionSourceMap: false,

  pages: {
    popup: {
      template: 'public/index.html',
      entry: 'src/popup/popup.ts',
      title: 'Popup',
      filename: 'index.html',
    },
    ...PLATFORM === 'extension' && {
      permissions: {
        template: 'src/popup/CameraRequestPermission.html',
        entry: 'src/popup/cameraPermission.js',
        title: 'cameraPermissions',
        filename: 'CameraRequestPermission.html',
      },
      offscreen: {
        template: 'src/offscreen/offscreen.html',
        entry: 'src/offscreen/offscreen.ts',
        title: 'offscreen',
        filename: 'offscreen.html',
      },
    },
  },

  pluginOptions: {
    ...PLATFORM === 'extension' && {
      browserExtension: {
        components: {
          background: true,
          popup: true,
          override: true,
          contentScripts: true,
        },
        componentOptions: {
          background: {
            entry: 'src/background/index.ts',
          },
          contentScripts: {
            entries: {
              inject: 'src/content-scripts/inject.js',
            },
          },
        },
        manifestTransformer: (manifest) => {
          manifest.permissions.push(...UNFINISHED_FEATURES ? ['clipboardRead'] : []);

          if (IS_FIREFOX_EXT) {
            manifest.background.page = '/offscreen.html';
            delete manifest.background.service_worker;

            manifest.browser_specific_settings = {
              gecko: {
                id: '{aee9e933-52b6-410a-8c3f-99c6be596b4e}',
              },
            };

            // sidePanel is a chrome specific feature - these settings causes warnings in FF
            delete manifest.side_panel;
            removeArrEntries(manifest.permissions, ['sidePanel']);
          } else {
            manifest.permissions.push('offscreen');
            delete manifest.sidebar_action;
          }

          return manifest;
        },
      },
    },
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'popup/locales',
      enableInSFC: false,
    },
  },

  chainWebpack: (config) => {
    config
      .plugin('node-polyfill')
      .use(NodePolyfillPlugin)
      .tap(() => [{
        includeAliases: ['stream', 'Buffer', 'path', 'process'],
      }]).end();

    config.resolve.alias
      .set('crypto', 'crypto-browserify')
      .set('vm', false)
      .set('core-js-pure', 'core-js')
      .set('lodash', 'lodash-es');

    config.plugin('define').tap((options) => {
      const definitions = { ...options[0] };

      Object.assign(definitions, {
        __VUE_I18N_FULL_INSTALL__: JSON.stringify(true),
        __INTLIFY_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_I18N_LEGACY_API__: JSON.stringify(false),
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
      });

      Object.entries(definitions['process.env']).forEach(([k, v]) => {
        definitions[`process.env.${k}`] = v;
      });
      delete definitions['process.env'];

      definitions['process.env.UNFINISHED_FEATURES'] = UNFINISHED_FEATURES;

      // eslint-disable-next-line camelcase
      if (npm_package_version) {
        definitions['process.env.npm_package_version'] = JSON.stringify(npm_package_version);
      }
      definitions['process.env.NODE_ENV'] = JSON.stringify(NODE_ENV);
      definitions['process.env.PLATFORM'] = JSON.stringify(PLATFORM);
      definitions['process.env.IS_EXTENSION'] = PLATFORM === 'extension' && !RUNNING_IN_TESTS;
      definitions['process.env.RUNNING_IN_TESTS'] = RUNNING_IN_TESTS;
      definitions['process.env.COMMIT_HASH'] = JSON.stringify(commitHash);
      definitions['process.env.BRANCH_NAME'] = JSON.stringify(branchName);
      definitions['process.env.NETWORK'] = JSON.stringify(process.env.NETWORK);
      definitions['process.env.SDK_VERSION'] = JSON.stringify(sdkVersion);
      definitions['process.env.ETHERSCAN_API_KEY'] = JSON.stringify(process.env.ETHERSCAN_API_KEY);
      definitions['process.env.WALLET_CONNECT_PROJECT_ID'] = JSON.stringify(process.env.WALLET_CONNECT_PROJECT_ID);

      return [definitions];
    }).end();

    if (PLATFORM === 'extension') {
      config.module.rule('i18nTest')
        .test(/\.json$/)
        .include
        .add(path.resolve(__dirname, './src/popup/locales'))
        .end()
        .type('javascript/auto')
        .use('@intlify/vue-i18n-loader')
        .loader('@intlify/vue-i18n-loader');

      config.plugin('copy')
        .use(CopyWebpackPlugin, [{
          patterns: [
            { from: 'public/favicons/favicon-48.png', to: 'icons/icon_48.png' },
            { from: 'public/favicons/favicon-128.png', to: 'icons/icon_128.png' },
            { from: 'public/icons/cameraRequestPermission', to: 'icons/cameraRequestPermission' },
            { from: 'src/icons/logo.svg', to: 'icons/cameraRequestPermission/logo.svg' },
          ],
        }])
        .end();
    }

    if (PLATFORM === 'web') {
      config.plugin('before-run')
        .use(EventHooksPlugin, [{
          beforeRun: (compilation, done) => {
            fs.copy('src/web', 'dist/web', done);
          },
        }]);
    }

    if (PLATFORM !== 'extension') {
      config.plugins.delete('provide-webextension-polyfill');
      config.plugins.delete('copy-manifest');
      config.module.rules.delete('provide-webextension-polyfill');
      config.plugins.delete('extension-reloader');
    }

    config.module.rule('aes')
      .test(/\.aes$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end();

    config.module.rule('svg')
      .set('type', 'javascript/auto')
      .uses.clear()
      .end()
      .oneOf('vue-component')
      .resourceQuery(/vue-component/)
      .use('vue-loader')
      .loader('vue-loader')
      .end()
      .use('custom-svg-loader')
      .loader(path.resolve(__dirname, './custom-svg-loader.js'))
      .options({
        svgo: {
          plugins: [{
            name: 'addClassesToSVGElement',
            params: {
              classNames: ['icon'],
            },
          }],
        },
      })
      .end()
      .end()
      .oneOf('default')
      .use('svg-url-loader')
      .loader('svg-url-loader')
      .options({
        noquotes: true,
        limit: 4096,
        name: 'img/[name].[hash:8].[ext]',
        esModule: false,
      })
      .end()
      .use('svgo-loader')
      .loader('svgo-loader')
      .end();

    return config;
  },
};
