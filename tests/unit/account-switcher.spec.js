import { shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Vue from 'vue';
import AccountSwitcher from '../../src/popup/router/components/AccountSwitcher.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
  getters: {
    accounts: () => [{
      idx: 0,
      showed: true,
    },
    {
      idx: 1,
      showed: true,
    }],
  },
  modules: {
    accounts: {
      namespaced: true,
      state: {
        activeIdx: 0,
      },
      mutations: {
        setActiveIdx(state, idx) {
          state.activeIdx = idx;
        },
      },
    },
  },
});

describe('Account switcher', () => {
  it('should render', () => {
    const wrapper = shallowMount(AccountSwitcher, {
      store,
    });
    expect(wrapper.find('.account-switcher').exists()).toBeTruthy();
  });
});
