/**
 * Declaration for SVG files imported as Vue components.
 */
declare module '*.svg?vue-component' {
  import type { DefineComponent } from 'vue';

  const content: DefineComponent<{}, {}, any>;
  export default content;
}

declare module '*.svg?component' {
  import type { DefineComponent } from 'vue';

  const content: DefineComponent<{}, {}, any>;
  export default content;
}

/**
 * Declaration for SVG (and other assets) imported as a URL string.
 */
declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.svg?url' {
  const src: string;
  export default src;
}

/**
 * Fallback for importing any module that has no type declaration.
 * Those modules will be treated as `any` now.
 */
declare module '*';
