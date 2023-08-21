/* eslint-disable import/no-extraneous-dependencies */

const { optimize } = require('svgo');
const { getOptions } = require('loader-utils');

/**
 *  This loader is used inside vue.config.js to load SVG files as Vue components.
 *  It replaces the previously used vue-svg-loader
 *  since it is not compatible with Vue 3.
 */
module.exports = function vueSvgLoader(svg) {
  const { svgo: svgoConfig } = getOptions(this) || {};

  if (svgoConfig !== false) {
    // eslint-disable-next-line no-param-reassign
    ({ data: svg } = optimize(svg, {
      path: this.resourcePath,
      ...svgoConfig,
    }));
  }

  return `<template>${svg}</template>`;
};
