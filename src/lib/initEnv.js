import Vue from 'vue';
import { defer } from 'lodash-es';

Object.assign(process.env, {
  ...(process.env.RUNNING_IN_POPUP === undefined && {
    RUNNING_IN_POPUP: !!window.opener && window.name.includes('popup'),
  }),
});
const url = new URL(window.location.href);

window.RUNNING_IN_POPUP =
  url.searchParams.get('id') &&
  (window.location.pathname.includes('popup.html') ||
    (process.env.RUNNING_IN_TESTS && window.location.pathname.includes('popup')));
window.POPUP_TYPE = url.searchParams.get('type') || null;
window.IS_EXTENSION_BACKGROUND =
  process.env.IS_EXTENSION && window.location.href.endsWith('_generated_background_page.html');

Vue.prototype.$watchUntilTruly = function watchUntilTruly(getter) {
  return new Promise((resolve) => {
    const unwatch = this.$watch(
      getter,
      (value) => {
        if (!value) return;
        resolve();
        defer(() => unwatch());
      },
      { immediate: true },
    );
  });
};
