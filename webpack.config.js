const path = require('path');
const { mergeWith } = require('lodash');
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

const transformHtml = content => ejs.render(content.toString(), process.env);

const commonPlugins = [
  new CleanWebpackPlugin({
    cleanStaleWebpackAssets: false,
  }),
  new VueLoaderPlugin(),
  new MiniCssExtractPlugin({
    filename: '[name].css',
    chunkFilename: '[id].css',
    ignoreOrder: false,
  }),
]

const commonConfig = {
  mode: process.env.NODE_ENV,
  context: path.resolve(__dirname, 'src'),
  entry: {
    background: './background.js',
    inject: './inject.js',
    'popup/popup': './popup/popup.js',
    'options/options': './options/options.js',
    'phishing/phishing': './phishing/phishing.js',
    'popup/cameraPermission': './popup/cameraPermission.js',
    'redirect/redirect': './redirect/redirect.js'
  },
  node: { fs: 'empty', net: 'empty', tls: 'empty' },
  output: {
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.js', '.vue'],
  },
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
        test: /\.(png|jpg|gif|ico)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?emitFile=false',
        },
      },
      {
        test: /\.svg$/,
        loader: 'vue-svg-loader',
      },
    ],
  },
  plugins: [
    ...commonPlugins,
    new CopyWebpackPlugin([
      { from: 'icons', to: `icons`, ignore: ['icon.xcf'] },
      { from: 'popup/popup.html', to: `popup/popup.html`, transform: transformHtml },
      { from: 'options/options.html', to: `options/options.html`, transform: transformHtml },
      { from: 'phishing/phishing.html', to: `phishing/phishing.html`, transform: transformHtml },
      { from: 'popup/CameraRequestPermission.html', to: `popup/CameraRequestPermission.html`, transform: transformHtml },
      { from: 'redirect/redirect.html', to: `redirect/index.html`, transform: transformHtml },
      { from: 'icons/icon_48.png', to: `popup/assets/logo-small.png` },
    ]),
  ],
};

const genPlatformDependentPlugins = platform => {
  const plugins = [
    new webpack.DefinePlugin({
      global: 'window',
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        IS_EXTENSION: platform !== 'cordova' && !process.env.RUNNING_IN_TESTS,
        npm_package_version: JSON.stringify(process.env.npm_package_version),
        NETWORK: JSON.stringify(process.env.NETWORK),
        RUNNING_IN_TESTS: JSON.stringify(process.env.RUNNING_IN_TESTS),
      },
    }),
  ];
  if (['chrome', 'firefox'].includes(platform)) {
    const isProd = process.env.NODE_ENV === 'production';
    const p = new GenerateJsonPlugin('manifest.json', genManifest(isProd, platform), null, 2);
    plugins.push(p);
  }
  return plugins;
};

const chromeConfig = {
  name: 'chrome',
  output: {
    path: path.resolve(__dirname, 'dist/chrome'),
  },
  plugins: [
    ...genPlatformDependentPlugins('chrome'),
    ...process.env.HMR === 'true' && process.env.RUNNING_IN_TESTS ? [new ChromeExtensionReloader({ port: 9099 })] : [],
  ],
};

const configs = [
  chromeConfig,
  {
    name: 'firefox',
    output: {
      path: path.resolve(__dirname, 'dist/firefox'),
    },
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
    plugins: [
      ...genPlatformDependentPlugins('firefox'),
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
    ],
  },
  {
    name: 'cordova',
    output: {
      path: path.resolve(__dirname, 'www'),
    },
    plugins: genPlatformDependentPlugins('cordova'),
  },
];

// These builds are loaded in browser when running e2e tests
const configsE2e = [
  chromeConfig,
  {
    name: 'aepp',
    entry: {
      aepp: './aepp/aepp.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist/aepp'),
    },
    plugins: [
      ...genPlatformDependentPlugins('aepp'),
      ...[ new CopyWebpackPlugin([ { from: 'aepp/aepp.html', to: `aepp.html`, transform: transformHtml }])]
    ],
  },
];

module.exports = (process.env.RUNNING_IN_TESTS ? configsE2e : configs).map(c => {
  const config = { ...commonConfig }
  if(c.name === "aepp") {
    config.entry = { }
    config.plugins = commonPlugins
  }
  const customizer = (obj, src) => (Array.isArray(obj) ? obj.concat(src) : undefined);
  return mergeWith({}, config, c, customizer);
});
