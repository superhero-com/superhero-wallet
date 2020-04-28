import Vue from 'vue';
import { defer } from 'lodash-es';
import App from './App';
import store from '../store';
import router from './router';
import { i18n } from './utils/i18nHelper';
import '../lib/initEnv';
import '../lib/initPolyfills';
import registerModals from './router/modals';
import Logger from '../lib/logger';

Logger.init();
Vue.prototype.$browser = global.browser;
Vue.prototype.$watchUntilTruly = function watchUntilTruly(getter) {
  return new Promise(resolve => {
    const unwatch = this.$watch(
      getter,
      value => {
        if (!value) return;
        resolve();
        defer(() => unwatch());
      },
      { immediate: true },
    );
  });
};
Vue.prototype.$logError = async function logError(error) {
  return Logger.write(error);
};

(async () => {
  await registerModals();
  new Vue({
    store,
    router,
    i18n,
    render: h => h(App),
  }).$mount('#app');
})();
