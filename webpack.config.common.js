const VueLoaderPlugin      = require('vue-loader/lib/plugin');
const HtmlPlugin           = require('html-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const isDev                = process.env.NODE_ENV === 'development';
const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const root = (param) => path.resolve(__dirname, param);

const webpackConfig = {
    entry: {
        popup: [
          '/home/lukas/projects/superhero-wallet/src/popup/popup.ts'
        ]
    },
    resolve: {
        alias: {
          'vue$': isDev ? 'vue/dist/vue.runtime.js' : 'vue/dist/vue.runtime.min.js',
          'core-js-pure': 'core-js',
          lodash: 'lodash-es'
        },
        extensions: [
          '.tsx',
          '.ts',
          '.mjs',
          '.js',
          '.jsx',
          '.vue',
          '.json',
          '.wasm'
        ],
        modules: [
          'node_modules',
          root('node_modules'),
        ],
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.js$/,
                exclude : [
                  /\bcore-js\b/,
                  /\bwebpack\/buildin\b/
                ],
                loader: 'babel-loader',
            },
            {
                test: /\.ts$/,
                use: [
                  {
                    loader: 'babel-loader'
                  },
                  {
                    loader: 'ts-loader',
                    options: {
                      // transpileOnly: true,
                      appendTsSuffixTo: [
                        '\\.vue$'
                      ],
                      happyPackMode: false,
                      configFile: root('tsconfig.json'),
                      // onlyCompileBundledFiles: true
                    }
                  }
                ]
              },
              {
                test: /\.mjs$/,
                type: 'javascript/auto',
                include: [
                  /node_modules/
                ]
              },
            {
                test: /\.css$/,
                use: [
                    isDev ? 'vue-style-loader' : MiniCSSExtractPlugin.loader,
                    { loader: 'css-loader', options: { sourceMap: isDev } },
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    isDev ? 'vue-style-loader' : MiniCSSExtractPlugin.loader,
                    { loader: 'css-loader', options: { sourceMap: isDev } },
                    { loader: 'sass-loader', options: { sourceMap: isDev } }
                ]
            },
            {
                test: /\.sass$/,
                use: [
                    isDev ? 'vue-style-loader' : MiniCSSExtractPlugin.loader,
                    { loader: 'css-loader', options: { sourceMap: isDev } },
                    { loader: 'sass-loader', options: { sourceMap: isDev } }
                ]
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
                use: [
                  {
                    loader: 'url-loader',
                    options: {
                      limit: 4096,
                      fallback: {
                        loader: 'file-loader',
                        options: {
                          name: 'fonts/[name].[hash:8].[ext]'
                        }
                      }
                    }
                  }
                ]
              },
              {
                test: /\.(png|jpe?g|gif|webp)(\?.*)?$/,
                use: [
                  {
                    loader: 'url-loader',
                    options: {
                      limit: 4096,
                      fallback: {
                        loader: 'file-loader',
                        options: {
                          name: 'img/[name].[hash:8].[ext]'
                        }
                      }
                    }
                  }
                ]
              },
              {
                test: /\.(svg)(\?.*)?$/,
                oneOf: [
                  {
                    resourceQuery: /vue-component/,
                    use: [
                      {
                        loader: 'babel-loader',
                        options: {
                          configFile: false,
                          presets: [
                            '@babel/preset-env'
                          ]
                        }
                      },
                      {
                        loader: 'vue-svg-loader',
                      }
                    ]
                  },
                  {
                    resourceQuery: /skip-optimize/,
                    use: [
                      {
                        loader: 'vue-svg-loader',
                        options: {
                          svgo: false
                        }
                      }
                    ]
                  },
                  {
                    use: [
                      {
                        loader: 'svg-url-loader',
                        options: {
                          noquotes: true,
                          limit: 4096,
                          name: 'img/[name].[hash:8].[ext]',
                          esModule: false
                        }
                      },
                      {
                        loader: 'svgo-loader'
                      }
                    ]
                  }
                ]
              },
        ]
    },
    plugins: [
        new VueLoaderPlugin(),
        new HtmlPlugin({ template: 'public/index.html', chunksSortMode: 'dependency' }),
        new ForkTsCheckerWebpackPlugin()
    ]
};

module.exports = webpackConfig;