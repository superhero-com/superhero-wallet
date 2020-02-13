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


const mode =  process.env.NODE_ENV === 'production' ? '' : '_dev';
const transformHtml = content => ejs.render(content.toString(), process.env);

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
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
      ignoreOrder: false,
    }),
    new CopyWebpackPlugin([
      { from: 'icons', to: `icons`, ignore: ['icon.xcf'] },
      { from: 'popup/popup.html', to: `popup/popup.html`, transform: transformHtml },
      { from: 'options/options.html', to: `options/options.html`, transform: transformHtml },
      { from: 'phishing/phishing.html', to: `phishing/phishing.html`, transform: transformHtml },
      { from: 'popup/CameraRequestPermission.html', to: `popup/CameraRequestPermission.html`, transform: transformHtml },
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
        IS_EXTENSION: platform !== 'cordova',
        npm_package_version: JSON.stringify(process.env.npm_package_version),
        NETWORK: JSON.stringify(process.env.NETWORK)
      },
    }),
  ];
  if (['chrome', 'firefox'].includes(platform)) {
    const p = new CopyWebpackPlugin([
      {
        from: `manifests/manifest_${platform}${mode}.json`,
        to: `manifest.json`,
        transform: content => {
          const jsonContent = JSON.parse(content);
          jsonContent.version = process.env.npm_package_version;

          if (process.env.NODE_ENV === 'development') {
            jsonContent.content_security_policy = "script-src 'self' 'unsafe-eval'; object-src 'self'";
          }

          return JSON.stringify(jsonContent, null, 2);
        },
      },
    ]);
    plugins.push(p);
  }
  return plugins;
};

module.exports = [
  {
    name: 'chrome',
    output: {
      path: path.resolve(__dirname, 'dist/chrome'),
    },
    plugins: [
      ...genPlatformDependentPlugins('chrome'),
      ...process.env.HMR === 'true' ? [new ChromeExtensionReloader({ port: 9099 })] : [],
    ],
  },
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
].map(c => {
  const customizer = (obj, src) => (Array.isArray(obj) ? obj.concat(src) : undefined);
  return mergeWith({}, commonConfig, c, customizer);
});
