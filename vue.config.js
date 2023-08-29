const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const commitHash = require('child_process').execSync('git rev-parse HEAD || echo dev').toString().trim();
const EventHooksPlugin = require('event-hooks-webpack-plugin');
const fs = require('fs-extra');
const { version: sdkVersion } = require('./node_modules/@aeternity/aepp-sdk/package.json');

// eslint-disable-next-line camelcase
const { npm_package_version, PLATFORM, NODE_ENV } = process.env;

const parseBool = (val) => (val ? JSON.parse(val) : false);

const RUNNING_IN_TESTS = parseBool(process.env.RUNNING_IN_TESTS);
const UNFINISHED_FEATURES = parseBool(process.env.UNFINISHED_FEATURES);
const IS_CORDOVA = PLATFORM === 'cordova';

module.exports = {
  publicPath: { web: '/', extension: '../' }[PLATFORM] || './',
  outputDir: {
    extension: 'dist/extension',
    cordova: 'www',
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
            entry: 'src/background/index.js',
          },
          contentScripts: {
            entries: {
              inject: 'src/content-scripts/inject.js',
            },
          },
        },
        manifestTransformer: (manifest) => {
          manifest.permissions.push(...UNFINISHED_FEATURES ? ['clipboardRead'] : []);
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
    config.plugin('define').tap((options) => {
      const definitions = { ...options[0] };

      Object.assign(definitions, {
        __VUE_I18N_FULL_INSTALL__: JSON.stringify(true),
        __INTLIFY_PROD_DEVTOOLS__: JSON.stringify(false),
        __VUE_I18N_LEGACY_API__: JSON.stringify(false),
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
      definitions['process.env.NETWORK'] = JSON.stringify(process.env.NETWORK);
      definitions['process.env.IS_CORDOVA'] = IS_CORDOVA;
      definitions['process.env.SDK_VERSION'] = JSON.stringify(sdkVersion);

      return [definitions];
    }).end();

    config
      .plugin('node-polyfill')
      .use(NodePolyfillPlugin)
      .tap(() => [{
        includeAliases: ['stream', 'Buffer'],
      }]).end();

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
            { from: 'public/favicons/request_permission.jpg', to: 'icons/request_permission.jpg' },
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

    config.resolve.alias
      .set('core-js-pure', 'core-js')
      .set('lodash', 'lodash-es');

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
      .oneOf('skip-optimize')
      .resourceQuery(/skip-optimize/)
      .use('vue-loader')
      .loader('vue-loader')
      .end()
      .use('custom-svg-loader')
      .loader(path.resolve(__dirname, './custom-svg-loader.js'))
      .options({ svgo: false })
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

  transpileDependencies: ['@aeternity/hd-wallet', '@download/blockies'],
};
