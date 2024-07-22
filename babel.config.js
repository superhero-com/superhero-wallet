module.exports = {
  presets: [
    ['@babel/preset-env', {
      useBuiltIns: 'usage',
      targets: '> 0.25%, not dead, not ie 11, not op_mini all',
      corejs: 3.22,
    }],
    '@vue/cli-plugin-babel/preset',
  ],
};
