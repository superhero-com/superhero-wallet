const path = require('path');
const webpack = require('webpack');
const ejs = require('ejs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');
const { VueLoaderPlugin } = require('vue-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const GenerateJsonPlugin = require('generate-json-webpack-plugin');
const commitHash = require('child_process')
  .execSync('git rev-parse HEAD')
  .toString().trim();
const sass = require('node-sass');
const genManifest = require('./src/manifest');

const parseBool = val => (val ? JSON.parse(val) : false);
const RUNNING_IN_TESTS = parseBool(process.env.RUNNING_IN_TESTS);

const getConfig = platform => {
  const transformHtml = content =>
    ejs.render(content.toString(), Object.assign({}, process.env, { PLATFORM: platform }));

  return {
    mode: process.env.NODE_ENV,
    context: path.resolve(__dirname, 'src'),
    entry: {
      ...(platform.startsWith('extension-') && {
        background: './background/index.js',
        'other/inject': './content-scripts/inject.js',
        'other/twitter': './content-scripts/twitter.js',
        'other/youtube': './content-scripts/youtube.js',
        'popup/popup': './popup/popup.js',
        'phishing/phishing': './phishing/phishing.js',
        'popup/cameraPermission': './popup/cameraPermission.js',
        'redirect/redirect': './redirect/redirect.js',
      }),
      ...(['cordova', 'web'].includes(platform) && { popup: './popup/popup.js' }),
      ...(platform === 'aepp' && { aepp: '../tests/aepp/aepp.js' }),
    },
    node: { fs: 'empty', net: 'empty', tls: 'empty' },
    output: {
      filename: '[name].js',
      publicPath:
        { web: '/', 'extension-chrome': '../', 'extension-firefox': '../' }[platform] || './',
      path: path.resolve(
        __dirname,
        {
          'extension-chrome': 'dist/chrome',
          'extension-firefox': 'dist/firefox',
          cordova: 'www',
          web: 'dist/web/root',
          aepp: 'dist/aepp',
        }[platform],
      ),
    },
    resolve: {
      extensions: ['.js', '.vue'],
    },
    ...(platform === 'extension-firefox' && {
      optimization: {
        splitChunks: {
          cacheGroups: {
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              chunks(chunk) {
                return chunk.name === 'popup/popup';
              },
              maxSize: 3999999,
            },
          },
        },
      },
    }),
    module: {
      rules: [
        {
          test: /\.vue$/,
          loaders: 'vue-loader',
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, { loader: 'css-loader', options: { minimize: true } }],
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: { minimize: true } },
            { loader: 'sass-loader', options: { minimize: true } },
          ],
        },
        {
          test: /\.sass$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader?indentedSyntax'],
        },
        {
          test: /\.(png|jpg|gif|svg|ico|woff2|woff)$/,
          oneOf: [
            {
              test: /\.svg$/,
              resourceQuery: /vue-component/,
              loader: 'vue-svg-loader',
            },
            {
              loader: 'url-loader',
              options: {
                name: '[name].[contenthash].[ext]',
                esModule: false,
                limit: 4096,
                outputPath: 'assets/',
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin({
        cleanStaleWebpackAssets: false,
      }),
      new VueLoaderPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
        ignoreOrder: false,
      }),
      new webpack.DefinePlugin({
        global: 'window',
        'process.env': {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV),
          IS_EXTENSION: platform.startsWith('extension-') && !RUNNING_IN_TESTS,
          PLATFORM: JSON.stringify(platform),
          npm_package_version: JSON.stringify(process.env.npm_package_version),
          NETWORK: JSON.stringify(process.env.NETWORK),
          RUNNING_IN_TESTS,
          COMMIT_HASH: JSON.stringify(commitHash),
        },
      }),
      ...(platform.startsWith('extension-')
        ? [
            new GenerateJsonPlugin(
              'manifest.json',
              genManifest(process.env.NODE_ENV === 'production', platform),
              null,
              2,
            ),
          ]
        : []),
      ...(platform === 'extension-firefox'
        ? [
            new HtmlWebpackPlugin({
              template: path.join(__dirname, 'src', 'popup', 'popup-firefox.html'),
              filename: 'popup/popup.html',
              excludeChunks: [
                'background',
                'other/youtube',
                'other/twitter',
                'other/inject',
                'phishing/phishing',
                'popup/cameraPermission',
              ],
            }),
            new HtmlWebpackPlugin({
              template: path.join(__dirname, 'src', 'phishing', 'phishing.html'),
              filename: 'phishing/phishing.html',
              chunks: ['phishing/phishing'],
            }),
          ]
        : []),
      ...(platform === 'extension-chrome' &&
      process.env.HMR === 'true' &&
      !process.env.RUNNING_IN_TESTS
        ? [new ChromeExtensionReloader({ port: 9099 })]
        : []),
      new CopyWebpackPlugin({
        patterns: [
          ...(platform.startsWith('extension-')
            ? [
                { from: 'popup/popup.html', to: `popup/popup.html`, transform: transformHtml },
                {
                  from: 'phishing/phishing.html',
                  to: `phishing/phishing.html`,
                  transform: transformHtml,
                },
                {
                  from: 'popup/CameraRequestPermission.html',
                  to: `popup/CameraRequestPermission.html`,
                  transform: transformHtml,
                },
                {
                  from: 'redirect/redirect.html',
                  to: `redirect/index.html`,
                  transform: transformHtml,
                },
                { from: 'icons/icon_48.png', to: `icons/icon_48.png` },
                { from: 'icons/icon_128.png', to: `icons/icon_128.png` },
                { from: 'icons/request_permission.jpg', to: `icons/request_permission.jpg` },
                {
                  from: path.join(__dirname, 'src/content-scripts/tipButton.scss'),
                  to: path.join(
                    __dirname,
                    {
                      'extension-chrome': 'dist/chrome/other/tipButton.css',
                      'extension-firefox': 'dist/firefox/other/tipButton.css',
                    }[platform],
                  ),
                  transform: (_, f) => sass.renderSync({ file: f }).css.toString(),
                },
              ]
            : []),
          ...(['cordova', 'web'].includes(platform)
            ? [{ from: 'popup/popup.html', to: `index.html`, transform: transformHtml }]
            : []),
          ...(platform === 'web'
            ? [
                { from: 'web', to: `../` },
                { from: 'popup/popup.html', to: `404.html`, transform: transformHtml },
              ]
            : []),
          ...(platform === 'aepp'
            ? [{ from: '../tests/aepp/aepp.html', to: `aepp.html`, transform: transformHtml }]
            : []),
        ],
      }),
    ],
  };
};

module.exports = (process.env.RUNNING_IN_TESTS
  ? ['extension-chrome', 'aepp']
  : ['extension-chrome', 'extension-firefox', 'cordova', 'web']
).map(p => getConfig(p));
