import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

/**
 * The codebase imports SVGs as Vue components via the legacy `?vue-component`
 * query (225 imports). `vite-svg-loader` uses `?component`. This `pre` plugin
 * rewrites the query so the existing imports keep working untouched.
 */
export function svgVueComponentAlias(): Plugin {
  return {
    name: 'sh:svg-vue-component-alias',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source.includes('.svg?vue-component')) {
        const rewritten = source.replace('?vue-component', '?component');
        const resolved = await this.resolve(rewritten, importer, {
          ...options,
          skipSelf: true,
        });
        if (resolved) return resolved.id;
      }
      return null;
    },
  };
}

/**
 * The extension HTML entries `offscreen.html` and `CameraRequestPermission.html`
 * live under `src/`, so Rollup emits them at their nested path. The manifest and
 * runtime (`IS_OFFSCREEN_TAB === pathname === '/offscreen.html'`) expect them at
 * the output root. This is safe because the extension build uses an absolute base
 * (`/`), so asset references inside the HTML are not relative to its location.
 */
export function flattenHtmlPlugin(): Plugin {
  return {
    name: 'sh:flatten-html',
    apply: 'build',
    // Run after the files are written to disk — Vite emits HTML in its own
    // generateBundle hook, so a disk move in writeBundle is the reliable point.
    writeBundle(options, bundle) {
      const outDir = options.dir as string;
      const movedFromDirs = new Set<string>();
      Object.keys(bundle).forEach((fileName) => {
        if (fileName.endsWith('.html') && fileName.includes('/')) {
          const flat = path.basename(fileName);
          const from = path.join(outDir, fileName);
          const to = path.join(outDir, flat);
          if (fs.existsSync(from)) {
            fs.renameSync(from, to);
            movedFromDirs.add(fileName.split('/')[0]);
          }
        }
      });
      // Remove now-empty top-level source dirs (e.g. `src/`) left behind.
      movedFromDirs.forEach((dir) => {
        const full = path.join(outDir, dir);
        try {
          fs.rmSync(full, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
      });
    },
  };
}

/**
 * Removes the `<!-- web-only:start -->...<!-- web-only:end -->` block from
 * index.html for non-web platforms (favicons / PWA manifest / canonical link
 * are only relevant to the hosted web app).
 */
export function stripWebOnlyHtmlPlugin(isWeb: boolean): Plugin {
  return {
    name: 'sh:strip-web-only-html',
    transformIndexHtml(html) {
      if (isWeb) return html;
      return html.replace(/<!-- web-only:start -->[\s\S]*?<!-- web-only:end -->/g, '');
    },
  };
}

/**
 * Dev-server only. Vite's client `env.mjs` applies the `process.env.*` defines
 * by doing `globalThis.process = globalThis.process || {}` and populating
 * `.env` — creating a partial `process` with no `version`/`browser`. The node
 * polyfill's per-module `globalThis.process = globalThis.process || shim` then
 * keeps that partial (the shim, which has `version: ''`, never wins). CommonJS
 * crypto deps (`create-hash` → `ripemd160` → `readable-stream`) read
 * `process.version.slice(...)` at module-eval time and crash on `undefined`,
 * blanking the app.
 *
 * Because `env.mjs` uses `||`, providing a complete `process` *before* it runs
 * makes it merge `env` into ours instead. This is a non-module inline script
 * injected at the very top of <head>, so it executes before the deferred
 * `@vite/client` module. Production builds inline defines statically and use
 * the real bundle polyfill, so this is `apply: 'serve'` only.
 */
export function devProcessPolyfillPlugin(): Plugin {
  const script = '(function(){var g=globalThis,p=g.process=g.process||{};'
    + 'if(!p.env)p.env={};'
    + 'if(p.browser===undefined)p.browser=true;'
    + "if(p.version===undefined)p.version='';"
    + 'if(!p.versions)p.versions={};'
    + "if(!p.platform)p.platform='browser';"
    + "if(!p.title)p.title='browser';"
    + 'if(!p.argv)p.argv=[];'
    + "if(typeof p.nextTick!=='function')p.nextTick=function(c){var a=[].slice.call(arguments,1);"
    + 'Promise.resolve().then(function(){c.apply(null,a)})};'
    + "['on','addListener','once','off','removeListener','removeAllListeners','emit',"
    + "'prependListener','prependOnceListener'].forEach(function(m){"
    + "if(typeof p[m]!=='function')p[m]=function(){return p}});"
    + "if(typeof p.listeners!=='function')p.listeners=function(){return[]};"
    + "if(typeof p.cwd!=='function')p.cwd=function(){return'/'};"
    + 'if(typeof p.umask!==\'function\')p.umask=function(){return 0};})();';
  return {
    name: 'sh:dev-process-polyfill',
    apply: 'serve',
    transformIndexHtml() {
      return [{ tag: 'script', injectTo: 'head-prepend', children: script }];
    },
  };
}

/**
 * Copies the `src/web` directory (nginx.conf, Dockerfile, root/ static assets)
 * into `dist/web` after the web build, replacing the old EventHooksPlugin step.
 *
 * Also copies the repo-root `icons/` set (icon-48.webp … icon-512.webp) into
 * `dist/web/root/icons`. `nginx.conf` serves `root/` as the HTTP document
 * root (`src/web/Dockerfile` does `COPY root /usr/share/nginx/html`), and
 * `manifest.webmanifest` plus the Open Graph/Twitter meta tags in
 * `index.html` reference these files at `/icons/*`.
 */
export function copyWebPlugin(): Plugin {
  return {
    name: 'sh:copy-web',
    apply: 'build',
    async closeBundle() {
      const fsExtra = await import('fs-extra');
      await fsExtra.default.copy('src/web', 'dist/web');
      await fsExtra.default.copy('icons', 'dist/web/root/icons');
    },
  };
}
