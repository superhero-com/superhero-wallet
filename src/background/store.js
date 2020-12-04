import Vue from 'vue';
import Vuex from 'vuex';
import persistState from '../store/plugins/persistState';
import permissions from '../store/modules/permissions';

Vue.use(Vuex);

export default window.IS_EXTENSION_BACKGROUND
  ? new Vuex.Store({
      plugins: [persistState()],
      modules: { permissions },
    })
  : null;
