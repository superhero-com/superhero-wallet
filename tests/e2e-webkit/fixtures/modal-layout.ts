import fs from 'fs';
import path from 'path';
import { parse, compileStyle } from 'vue/compiler-sfc';
import * as sass from 'sass';
import type { Page } from 'playwright-core';

const ROOT = path.resolve(__dirname, '../../..');
const COMPONENTS = {
  Modal: 'components/Modal.vue',
  FixedScreenFooter: 'components/FixedScreenFooter.vue',
};

/**
 * The real templates and scoped styles of the modal and its footer, with stand-in scripts.
 * Desktop WebKit has no safe area, so the production rules read the bottom inset
 * from a test variable instead of `env()`.
 */
export function buildModalLayoutFixture() {
  const templates: Record<string, string> = {};
  const styles = Object.entries(COMPONENTS).map(([name, relativePath]) => {
    const filename = path.join(ROOT, 'src/popup', relativePath);
    const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
    templates[name] = descriptor.template!.content;
    return descriptor.styles.map((style) => {
      const { css } = sass.compileString(style.content.replaceAll('@/', ''), {
        loadPaths: [path.join(ROOT, 'src'), path.join(ROOT, 'node_modules')],
        logger: sass.Logger.silent,
      });
      const compiled = compileStyle({
        source: css,
        filename,
        id: `data-v-layout-${name.toLowerCase()}`,
        scoped: style.scoped,
      });
      if (compiled.errors.length) throw compiled.errors[0];
      return compiled.code;
    }).join('\n');
  }).join('\n').replaceAll('env(safe-area-inset-bottom)', 'var(--test-safe-area-bottom, 0px)')
    .replaceAll('env(safe-area-inset-top)', '0px');
  return {
    templates,
    styles: `
      * { box-sizing: border-box; }
      body { margin: 0; background: white; }
      .test-root *, .test-root *::before, .test-root *::after {
        transition: none !important; animation: none !important;
      }
      ${styles}`,
    runtime: fs.readFileSync(path.join(ROOT, 'node_modules/vue/dist/vue.global.prod.js'), 'utf8'),
  };
}

const BROWSER_FIXTURE = `({ templates }) => {
  const { defineComponent, computed, createApp, compile, h, nextTick } = Vue;
  const components = {};
  const bools = (names) => Object.fromEntries(names.split(' ').map((name) => [name, Boolean]));
  function component(name, props, setup) {
    components[name] = defineComponent({
      name, props, setup,
      __scopeId: 'data-v-layout-' + name.toLowerCase(),
      render: compile(templates[name], { hoistStatic: false }),
    });
  }
  // The props of Modal.vue
  component('Modal', {
    ...bools('show hasCloseButton fullScreen fromBottom dense semiDense noBgBlur noPadding noPaddingBottom centered minHeight transparent'),
    header: String,
  }, (props) => ({
    IS_FIREFOX: false, IS_EXTENSION: false,
    showHeader: computed(() => props.header || props.hasCloseButton),
    transitionName: computed(() => (props.fromBottom ? 'from-bottom-transition' : 'pop-in-transition')),
    handleClose() {},
  }));
  component('FixedScreenFooter', {}, () => ({ IS_MOBILE_DEVICE: true, status: false, modalsOpen: [] }));
  components.BackToTop = { render: () => null };
  let app;
  window.renderFixture = async ({ inset = 34, fullScreen = true, fromBottom = false, transparent = false } = {}) => {
    app?.unmount();
    document.documentElement.style.setProperty('--test-safe-area-bottom', inset + 'px');
    app = createApp({
      render: () => h(components.Modal, { show: true, fullScreen, fromBottom, transparent }, {
        default: () => h('p', { style: 'height: 100px' }, 'Modal content'),
        footer: () => h('button', { style: 'width: 100%; height: 48px' }, 'Confirm'),
      }),
    });
    Object.entries(components).forEach(([name, value]) => app.component(name, value));
    app.mount('#fixture');
    await nextTick();
  };
}`;

export interface ModalLayoutOptions {
  inset?: number;
  fullScreen?: boolean;
  fromBottom?: boolean;
  transparent?: boolean;
}

export async function installModalLayoutFixture(
  page: Page,
  fixture: ReturnType<typeof buildModalLayoutFixture>,
) {
  await page.setContent(`<!doctype html><html class="is-mobile is-mobile-ios"><head>
    <style>${fixture.styles}</style></head><body><div id="fixture" class="test-root"></div></body></html>`);
  await page.addScriptTag({ content: fixture.runtime });
  await page.evaluate(`(${BROWSER_FIXTURE})(${JSON.stringify({ templates: fixture.templates })})`);
}

export async function renderModalLayout(page: Page, options: ModalLayoutOptions = {}) {
  await page.evaluate(`window.renderFixture(${JSON.stringify(options)})`);
  await page.waitForFunction(() => !document.querySelector('.modal')!.className.includes('transition-enter'));
}
