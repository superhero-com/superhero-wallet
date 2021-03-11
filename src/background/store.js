import Vue from 'vue';
import Vuex from 'vuex';
import persistState from '../store/plugins/persistState';
import permissions from '../store/modules/permissions';
import getters from '../store/getters';

Vue.use(Vuex);

export default window.IS_EXTENSION_BACKGROUND
  ? new Vuex.Store({
      plugins: [persistState()],
      modules: { permissions },
      getters: {
        'names/getDefault': () => (address) => `placeholder name for ${address}`,
        account: getters.account,
      },
    })
  : null;
