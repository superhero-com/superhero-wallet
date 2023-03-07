/* eslint-disable no-unused-vars */

/**
 * Global object available when running as the extension.
 */
declare const browser: undefined | {
  runtime: any
  tabs: any
  webNavigation: any
  contextMenus: any
  storage: any
};

declare module '*.vue' {
  import Vue from 'vue';

  export default Vue;
}

/**
 * Declaration for SVG files imported as Vue components.
 */
declare module '*.svg?vue-component' {
  import Vue, { VueConstructor } from 'vue';

  const content: VueConstructor<Vue>;
  export default content;
}

/**
 * Fallback for importing any module that has no type declaration.
 * Those modules will be treated as `any` now.
 */
declare module '*';
