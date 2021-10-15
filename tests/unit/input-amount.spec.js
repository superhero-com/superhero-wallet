import Vue from 'vue';
import Vuex from 'vuex';
import { mount, createLocalVue } from '@vue/test-utils';
import InputAmount from '../../src/popup/router/components/InputAmount.vue';

Object.assign(Vue.prototype, {
  $t: () => 'locale-specific-text',
});

const localVue = createLocalVue();
localVue.use(Vuex);
const store = new Vuex.Store({
  getters: {
    currentCurrencyRate: () => 3,
    formatCurrency: () => (value) => (+value).toFixed(2),
  },
  modules: {
    fungibleTokens: {
      state: {
        token: null,
      },
      namespaced: true,
      getters: {
        selectedToken: ({ token }) => token,
      },
      mutations: {
        setToken(state, token) {
          state.token = token;
        },
      },
    },
  },
});

describe('InputAmount', () => {
  [{
    name: 'input zero',
    value: 0,
    displayed: 0,
    currency: 0,
  },
  {
    name: 'input int',
    value: 1,
    displayed: 1,
    currency: 3,
  },
  {
    name: 'input float',
    value: 0.1234567890,
    displayed: 0.1234567890,
    currency: 0.37,
  },
  {
    name: 'input in exponential notation',
    value: '1e2',
    displayed: '1e2',
    currency: 300,
  },
  {
    name: 'input negative int',
    error: true,
    value: -1,
    displayed: -1,
    currency: -3,
  },
  {
    name: 'input float with token',
    token: { symbol: 'AR' },
    value: 0.1234567890,
    displayed: 0.1234567890,
    currency: 0,
  }].forEach((test) => it(test.name, () => {
    if (test.token) {
      store.commit('fungibleTokens/setToken', test.token);
    }
    const wrapper = mount(InputAmount, { localVue, store, attrs: { value: test.value } });
    expect(wrapper.find('input').element.value).toBe(test.displayed.toString());
    expect(wrapper.find('.token').text()).toBe(test.token?.symbol || 'AE');
    if (!store.getters['fungibleTokens/selectedToken']) {
      expect(wrapper.find('[data-cy=amount-currency]').text()).toBe(`(${test.currency.toFixed(2)})`);
    }
    if (test.error) {
      expect(wrapper.find('.message.error').exists()).toBeTruthy();
    }
  }));
});
