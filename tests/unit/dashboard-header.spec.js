import { shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Vue from 'vue';
import DashboardHeader from '../../src/popup/components/DashboardHeader.vue';
import { NETWORK_TESTNET } from '../../src/popup/utils';

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
    activeNetwork: () => (NETWORK_TESTNET),
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

describe('Dashboard header', () => {
  it('should render', () => {
    const wrapper = shallowMount(DashboardHeader, {
      store,
      mocks: {
        $route: {
          meta: {
            isMultisigPage: false,
          },
        },
      },
    });
    expect(wrapper.find('.dashboard-header').exists()).toBeTruthy();
  });
});
