import path from 'path';

const r = (...p: string[]) => path.resolve(process.cwd(), ...p);

/**
 * Aliases the Vite app build and the Vitest test runner must agree on, so
 * tests exercise the same module graph as the shipped app. Vite has extra
 * build-only aliases (`core-js-pure`, `vm`) that tests must NOT inherit —
 * `vm` in particular is a real Node builtin tests should keep using.
 */
export const sharedAlias = {
  '@': r('src'),
  lodash: 'lodash-es',
};
