const webpack = require('webpack');
const ejs = require('ejs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');
const { VueLoaderPlugin } = require('vue-loader');
const { version } = require('./package.json');
const platforms = [
  "chrome",
  "firefox"
];


const config = {
  mode: process.env.NODE_ENV,
  context: __dirname + '/src',
  entry: {
    ...getPlatformFiles(),
    background: './background.js'
  
  },
  node: {
    fs: 'empty', net: 'empty', tls: 'empty'
  },
  output: {
    path: __dirname + '/dist',
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
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.sass$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader?indentedSyntax'],
      },
      {
        test: /\.(html|png|jpg|gif|svg|ico)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?emitFile=false',
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      global: 'window',
    }),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    ...platforms.map((platform) => {
      return new CopyWebpackPlugin([
        { from: '../node_modules/argon2-browser', to: `${platform}/argon2` },
        { from: 'icons', to: `${platform}/icons`, ignore: ['icon.xcf'] },
        { from: 'popup/popup.html', to: `${platform}/popup/popup.html`, transform: transformHtml },
        { from: 'options/options.html', to: `${platform}/options/options.html`, transform: transformHtml },
        { from: 'phishing/phishing.html', to: `${platform}/phishing/phishing.html`, transform:transformHtml },
        { from: 'popup/CameraRequestPermission.html', to: `${platform}/popup/CameraRequestPermission.html`, transform:transformHtml },
        { from: 'icons/icon_48.png', to: `${platform}/popup/assets/logo-small.png` },
        {
          from: `manifests/manifest_${platform}.json`,
          to: `${platform}/manifest.json`,
          transform: content => {
            const jsonContent = JSON.parse(content);
            jsonContent.version = version;
  
            if (config.mode === 'development') {
              jsonContent['content_security_policy'] = "script-src 'self' 'unsafe-eval'; object-src 'self'";
            }
  
            return JSON.stringify(jsonContent, null, 2);
          },
        },
      ])
    }),

  ],
};

if (config.mode === 'production') {
  config.plugins = (config.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
  ]);
}

if (process.env.HMR === 'true') {
  config.plugins = (config.plugins || []).concat([
    new ChromeExtensionReloader({
      entries: { 
        background: 'background' 
      }
    }),
  ]);
}

function transformHtml(content) {
  return ejs.render(content.toString(), {
    ...process.env,
  });
}

function getPlatformFiles() {
  let files = {}
  let pl = platforms.map((platform) => {
    return {
      [`${platform}/background`]: './background.js',
      [`${platform}/inject`]: './inject.js',
      [`${platform}/popup/popup`]: './popup/popup.js',
      [`${platform}/options/options`]: './options/options.js',
      [`${platform}/main`]:'./main.js',
      [`${platform}/phishing/phishing`]:'./phishing/phishing.js',
      [`${platform}/aepp`]:'./aepp.js',
      [`${platform}/popup/cameraPermission`]:'./popup/cameraPermission.js'
    }
  })

  pl.forEach(p => {
    files =  {
      ...files,
      ...p
    }
  })
  return files
}


module.exports = config;