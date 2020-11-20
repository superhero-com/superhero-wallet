import Vue from 'vue';
import { defer } from 'lodash-es';
import sync from '../lib/vuexRouterSync';
import App from './App';
import store from '../store';
import router from './router';
import { i18n } from './utils/i18nHelper';
import '../lib/initEnv';
import '../lib/initPolyfills';
import registerModals from './router/modals';
import Logger from '../lib/logger';

Vue.prototype.$watchUntilTruly = function watchUntilTruly(getter) {
  return new Promise(resolve => {
    const unwatch = this.$watch(
      getter,
      value => {
        if (!value) return;
        resolve();
        defer(unwatch);
      },
      { immediate: true },
    );
  });
};

registerModals();
sync(store, router);
new Vue({
  store,
  router,
  i18n,
  render: h => h(App),
}).$mount('#app');
Logger.init();
