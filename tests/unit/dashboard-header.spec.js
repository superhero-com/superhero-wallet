import { shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import DashboardHeader from '../../src/popup/components/DashboardHeader.vue';
import { NETWORK_TESTNET } from '../../src/constants';

jest.mock('../../src/store/index.js', () => ({}));

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
      global: {
        plugins: [store],
        mocks: {
          $route: {
            meta: {
              isMultisigPage: false,
            },
          },
        },
      },
    });
    expect(wrapper.find('.dashboard-header').exists()).toBeTruthy();
  });
});
