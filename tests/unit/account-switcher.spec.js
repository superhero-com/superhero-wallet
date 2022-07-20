import { shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Vue from 'vue';
import AccountSwitcher from '../../src/popup/router/components/AccountSwitcher.vue';
import ButtonPlain from '../../src/popup/router/components/ButtonPlain.vue';

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
  it('should highlight active account and then on click highlight another one', async () => {
    const wrapper = shallowMount(AccountSwitcher, {
      mocks: {
        store,
        $store: store,
        $watchUntilTruly: jest.fn(),
      },
      stubs: {
        ButtonPlain,
      },
    });
    const buttonWrapper = wrapper.findAllComponents('.button-plain');
    expect(buttonWrapper.at(0).classes()).toContain('selected');
    buttonWrapper.at(1).trigger('click');
    await wrapper.vm.$nextTick();
    expect(buttonWrapper.at(1).classes()).toContain('selected');
    expect(buttonWrapper.at(0).classes()).not.toContain('selected');
  });
});
