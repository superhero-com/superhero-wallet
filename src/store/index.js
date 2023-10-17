import Vuex from 'vuex';
import persistState from './plugins/persistState';
import runMigrations from './migrations';
import stateReducer from './utils';
import veeValidate from './plugins/veeValidate';

export default new Vuex.Store({
  state: {
    isRestored: false,
    migrations: {},
  },
  plugins: [
    persistState(
      runMigrations,
      stateReducer,
    ),
    veeValidate,
  ],
});
