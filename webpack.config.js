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
const genManifest = require('./src/manifest');

const parseBool = val => (val ? JSON.parse(val) : false);
const RUNNING_IN_TESTS = parseBool(process.env.RUNNING_IN_TESTS);

const getConfig = platform => {
  const transformHtml = content => ejs.render(content.toString(), Object.assign({}, process.env, { PLATFORM: platform }));

  return {
    mode: process.env.NODE_ENV,
    context: path.resolve(__dirname, 'src'),
    entry: {
      ...(['chrome', 'firefox'].includes(platform) && {
        'other/background': './background.js',
        'other/inject': './inject.js',
        'popup/popup': './popup/popup.js',
        'options/options': './options/options.js',
        'phishing/phishing': './phishing/phishing.js',
        'popup/cameraPermission': './popup/cameraPermission.js',
        'redirect/redirect': './redirect/redirect.js',
      }),
      ...(['cordova', 'web'].includes(platform) && { popup: './popup/popup.js' }),
      ...(platform === 'aepp' && { aepp: './aepp/aepp.js' }),
    },
    node: { fs: 'empty', net: 'empty', tls: 'empty' },
    output: {
      filename: '[name].js',
      publicPath: { web: '/', chrome: '../', firefox: '../' }[platform] || './',
      path: path.resolve(
        __dirname,
        {
          chrome: 'dist/chrome',
          firefox: 'dist/firefox',
          cordova: 'www',
          web: 'dist/web/root',
          aepp: 'dist/aepp',
        }[platform]
      ),
    },
    resolve: {
      extensions: ['.js', '.vue'],
    },
    ...(platform === 'firefox' && {
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
          test: /\.(png|jpg|gif|svg|ico)$/,
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
          IS_EXTENSION: ['chrome', 'firefox'].includes(platform) && !RUNNING_IN_TESTS,
          PLATFORM: JSON.stringify(platform),
          npm_package_version: JSON.stringify(process.env.npm_package_version),
          NETWORK: JSON.stringify(process.env.NETWORK),
          RUNNING_IN_TESTS,
        },
      }),
      ...(['chrome', 'firefox'].includes(platform)
        ? [
            new CopyWebpackPlugin([
              { from: 'popup/popup.html', to: `popup/popup.html`, transform: transformHtml },
              { from: 'options/options.html', to: `options/options.html`, transform: transformHtml },
              { from: 'phishing/phishing.html', to: `phishing/phishing.html`, transform: transformHtml },
              { from: 'popup/CameraRequestPermission.html', to: `popup/CameraRequestPermission.html`, transform: transformHtml },
              { from: 'redirect/redirect.html', to: `redirect/index.html`, transform: transformHtml },
              { from: 'icons/icon_48.png', to: `icons/icon_48.png` },
              { from: 'icons/icon_128.png', to: `icons/icon_128.png` },
            ]),
            new GenerateJsonPlugin('manifest.json', genManifest(process.env.NODE_ENV === 'production', platform), null, 2),
          ]
        : []),
      ...(platform === 'firefox'
        ? [
            new HtmlWebpackPlugin({
              template: path.join(__dirname, 'src', 'popup', 'popup-firefox.html'),
              filename: 'popup/popup.html',
              excludeChunks: ['background', 'inject', 'options/options', 'phishing/phishing', 'aepp', 'popup/cameraPermission'],
            }),
            new HtmlWebpackPlugin({
              template: path.join(__dirname, 'src', 'options', 'options.html'),
              filename: 'options/options.html',
              chunks: ['options/options'],
            }),
            new HtmlWebpackPlugin({
              template: path.join(__dirname, 'src', 'phishing', 'phishing.html'),
              filename: 'phishing/phishing.html',
              chunks: ['phishing/phishing'],
            }),
          ]
        : []),
      ...(platform === 'chrome' && process.env.HMR === 'true' && !process.env.RUNNING_IN_TESTS ? [new ChromeExtensionReloader({ port: 9099 })] : []),
      ...(['cordova', 'web'].includes(platform) ? [new CopyWebpackPlugin([{ from: 'popup/popup.html', to: `index.html`, transform: transformHtml }])] : []),
      ...(platform === 'web' ? [new CopyWebpackPlugin([{ from: 'web', to: `../` }])] : []),
      ...(platform === 'aepp' ? [new CopyWebpackPlugin([{ from: 'aepp/aepp.html', to: `aepp.html`, transform: transformHtml }])] : []),
    ],
  };
};

module.exports = (process.env.RUNNING_IN_TESTS ? ['chrome', 'aepp'] : ['chrome', 'firefox', 'cordova', 'web']).map(p => getConfig(p));
