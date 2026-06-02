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
 * Splits third-party dependencies out of the app bundle, replacing the old
 * webpack `splitChunks` config.
 *
 * IMPORTANT: all of node_modules goes into a SINGLE `vendor` chunk. The crypto
 * stack (sha.js / create-hash / bitcoinjs / secp256k1 …) ships as CommonJS with
 * lazy `require()` wrappers; splitting those interdependent modules across
 * multiple chunks separates a module's synthetic `exports` object from its
 * initializer and crashes at runtime ("Object.defineProperty called on
 * non-object"). Keeping every dependency together avoids cross-chunk CJS.
 */
export function vendorManualChunks(id: string): string | undefined {
  if (id.includes('node_modules')) return 'vendor';
  return undefined;
}

/**
 * Copies the `src/web` directory (nginx.conf, Dockerfile, root/ static assets)
 * into `dist/web` after the web build, replacing the old EventHooksPlugin step.
 */
export function copyWebPlugin(): Plugin {
  return {
    name: 'sh:copy-web',
    apply: 'build',
    async closeBundle() {
      const fs = await import('fs-extra');
      await fs.default.copy('src/web', 'dist/web');
    },
  };
}
