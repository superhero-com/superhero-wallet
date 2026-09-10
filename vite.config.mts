import { defineConfig, loadEnv } from 'vite';
import type { PluginOption } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import vueI18n from '@intlify/unplugin-vue-i18n/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { visualizer } from 'rollup-plugin-visualizer';
import inject from '@rollup/plugin-inject';
import { readFileSync } from 'fs';
import path from 'path';

import { getDefine, type Platform } from './build/env';
import { sharedAlias } from './build/sharedAlias';
import { manifestPlugin } from './build/manifest-plugin';
import {
  svgVueComponentAlias,
  flattenHtmlPlugin,
  copyWebPlugin,
  stripWebOnlyHtmlPlugin,
  vendorManualChunks,
  devProcessPolyfillPlugin,
} from './build/plugins';

const parseBool = (val?: string): boolean => (val ? JSON.parse(val) : false);

const r = (...p: string[]) => path.resolve(process.cwd(), ...p);

/** Browser-extension build step, selected by the orchestrator (scripts/build-extension.mjs). */
type BuildStep = 'html' | 'sw' | 'inject' | 'inpage';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const PLATFORM = (process.env.PLATFORM || env.PLATFORM || 'web') as Platform;
  const IS_FIREFOX_EXT = parseBool(process.env.IS_FIREFOX_EXT || env.IS_FIREFOX_EXT);
  const REVIEW_BUILD = parseBool(process.env.REVIEW_BUILD || env.REVIEW_BUILD);
  const UNFINISHED_FEATURES = parseBool(env.UNFINISHED_FEATURES);
  const BUILD_STEP = (process.env.BUILD_STEP || 'html') as BuildStep;

  const isExtension = PLATFORM === 'extension';
  const isDev = mode === 'development';

  const outDir = {
    web: 'dist/web/root',
    ionic: 'www',
    extension: IS_FIREFOX_EXT ? 'dist/extension/firefox' : 'dist/extension/chrome',
  }[PLATFORM];

  const base = PLATFORM === 'ionic' ? './' : '/';

  // Whether this build step produces a single self-contained IIFE bundle.
  const isSingleFileStep = isExtension && (BUILD_STEP === 'sw' || BUILD_STEP === 'inject' || BUILD_STEP === 'inpage');

  // Set by the watch-mode orchestrator (scripts/build-extension.mjs) on the
  // 'html' step's own watcher, once a one-off bootstrap build has already
  // populated outDir — wiping it again would race the other steps' watchers.
  const skipEmptyOutDir = parseBool(process.env.SKIP_EMPTY_OUT_DIR);

  // Maps a single-file build step to its [outputName, entryFile]. The output
  // name controls the emitted filename (js/<name>.js) — the SW must be
  // js/background.js to match the manifest.
  const singleFileEntry: Record<Exclude<BuildStep, 'html'>, { name: string; entry: string }> = {
    sw: { name: 'background', entry: r('src/background/index.ts') },
    inject: { name: 'inject', entry: r('src/content-scripts/inject.ts') },
    inpage: { name: 'inpage', entry: r('src/content-scripts/inpage.ts') },
  };

  // inpage runs in the host page's main world — do not pollute its globals.
  const polyfillGlobals = isExtension && BUILD_STEP === 'inpage'
    ? { Buffer: false as const, global: false as const, process: false as const }
    : { Buffer: true as const, global: true as const, process: true as const };

  const plugins: PluginOption[] = [
    devProcessPolyfillPlugin(),
    svgVueComponentAlias(),
    vue(),
    svgLoader({
      defaultImport: 'url',
      svgoConfig: {
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                // Keep transform-bearing groups intact. Both plugins otherwise
                // dissolve `<g transform="matrix(...)">` wrappers and bake the
                // matrix into child path data — which breaks SMIL animations
                // like animated-spinner.svg, where `<animateTransform>` rotates
                // around the coordinate system the group's matrix establishes.
                collapseGroups: false,
                moveGroupAttrsToElems: false,
              },
            },
          },
          {
            name: 'addClassesToSVGElement',
            params: { classNames: ['icon'] },
          },
        ],
      },
    }),
    vueI18n({
      include: [r('src/popup/locales/**')],
      strictMessage: false,
      escapeHtml: false,
    }),
    nodePolyfills({
      globals: polyfillGlobals,
      protocolImports: true,
    }),
    stripWebOnlyHtmlPlugin(PLATFORM === 'web'),
  ];

  if (isExtension && BUILD_STEP === 'html') {
    plugins.push(
      manifestPlugin({
        isFirefox: IS_FIREFOX_EXT,
        unfinishedFeatures: UNFINISHED_FEATURES,
        version: JSON.parse(readFileSync(r('package.json'), 'utf-8')).version,
      }),
      flattenHtmlPlugin(),
      // vite-plugin-static-copy v3+ appends the matched file's source directory
      // to `dest` (e.g. `public/favicons/` ends up under `icons/`). `stripBase`
      // removes those leading segments so the files land flat where the manifest
      // expects them (`icons/icon_48.png`, etc.).
      viteStaticCopy({
        targets: [
          { src: 'public/favicons/favicon-48.png', dest: 'icons', rename: { stripBase: true, name: 'icon_48.png' } },
          { src: 'public/favicons/favicon-128.png', dest: 'icons', rename: { stripBase: true, name: 'icon_128.png' } },
          // keep the `cameraRequestPermission` folder, drop the `public/icons/` prefix
          { src: 'public/icons/cameraRequestPermission', dest: 'icons', rename: { stripBase: 2 } },
          { src: 'src/icons/logo.svg', dest: 'icons/cameraRequestPermission', rename: { stripBase: true } },
        ],
      }),
    );
  }

  if (PLATFORM === 'web') {
    plugins.push(copyWebPlugin());
  }

  // Extension builds run 4 separate `vite build` passes (html/sw/inject/inpage);
  // only 'html' has the chunk graph worth analyzing — the others would just
  // overwrite the same output file with a near-empty tree.
  const canAnalyzeThisStep = !isExtension || BUILD_STEP === 'html';
  const pushVisualizer = (filename: string) => plugins.push(
    visualizer({
      filename: r(filename),
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
    }) as PluginOption,
  );

  // Temporary: `BUNDLE_ANALYZE=true` emits a treemap for any build (web included).
  if (canAnalyzeThisStep && parseBool(process.env.BUNDLE_ANALYZE)) {
    pushVisualizer('artifacts/bundle-stats.html');
  }

  // Emit a bundle treemap + raw stats JSON for review/provenance builds.
  if (canAnalyzeThisStep && REVIEW_BUILD && isExtension) {
    pushVisualizer('artifacts/review/bundle-stats.html');
  }

  // Build inputs / output naming.
  const rollupInput = (() => {
    if (!isExtension) return undefined; // index.html auto-detected
    if (BUILD_STEP === 'html') {
      return {
        index: r('index.html'),
        offscreen: r('src/offscreen/offscreen.html'),
        permissions: r('src/popup/CameraRequestPermission.html'),
      };
    }
    const { name, entry } = singleFileEntry[BUILD_STEP as Exclude<BuildStep, 'html'>];
    return { [name]: entry };
  })();

  return {
    base,
    publicDir: isExtension ? false : 'public',
    resolve: {
      alias: {
        ...sharedAlias,
        'core-js-pure': 'core-js',
        vm: r('build/empty.js'),
      },
    },
    define: getDefine({ env, mode, platform: PLATFORM, reviewBuild: REVIEW_BUILD }),
    plugins,
    css: {
      preprocessorOptions: {
        scss: { api: 'modern-compiler' },
      },
    },
    optimizeDeps: {
      include: [
        '@aeternity/aepp-sdk',
        'bitcoinjs-lib',
        'bip32',
        'ecpair',
        '@scure/bip39',
        '@solana/web3.js',
        'web3-eth',
        'webextension-polyfill',
      ],
      esbuildOptions: {
        // Keep in sync with `build.target` below so prebundled deps and the
        // production output share one syntax floor.
        target: 'es2020',
        define: { global: 'globalThis' },
      },
    },
    build: {
      outDir,
      // The old webpack/babel build downleveled to '> 0.25%, not dead, not ie 11'
      // with core-js polyfills; that's gone, but syntax newer than the actual
      // floor (Capacitor Android WebView defaults to 60+, iOS 15.5, extension
      // manifest v3 Chrome 88+/Firefox 109+) can throw a parse-time SyntaxError
      // and blank the whole app. es2020 covers that floor without the cost of a
      // full legacy/polyfill toolchain for what's otherwise an evergreen-browser app.
      target: 'es2020',
      sourcemap: isDev,
      emptyOutDir: !isSingleFileStep && !skipEmptyOutDir,
      assetsInlineLimit: 4096,
      modulePreload: isExtension ? false : undefined,
      commonjsOptions: { transformMixedEsModules: true },
      rollupOptions: {
        ...(rollupInput ? { input: rollupInput } : {}),
        ...(isExtension
          ? { plugins: [inject({ browser: 'webextension-polyfill' })] }
          : {}),
        output: isSingleFileStep
          ? {
            format: 'iife',
            inlineDynamicImports: true,
            entryFileNames: 'js/[name].js',
            assetFileNames: 'img/[name][extname]',
          }
          : isExtension
            ? {
              format: 'es',
              entryFileNames: 'js/[name].js',
              chunkFileNames: 'js/[name].js',
              assetFileNames: (info: any) => (/\.css$/.test(info.name ?? '')
                ? 'css/[name][extname]'
                : 'img/[name][extname]'),
              manualChunks: vendorManualChunks,
            }
            : {
              manualChunks: vendorManualChunks,
            },
      },
    },
    server: {
      port: 8080,
    },
  };
});
