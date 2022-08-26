import Vue from 'vue';
import Vuex from 'vuex';
import BigNumber from 'bignumber.js';
import { mount } from '@vue/test-utils';
import InputAmount from '../../src/popup/router/components/InputAmount.vue';
import veeValidate from '../../src/store/plugins/veeValidate';

Object.assign(Vue.prototype, {
  $t: () => 'locale-specific-text',
  $watchUntilTruly: async () => new Promise((res) => setTimeout(res, 500)),
});

Vue.use(Vuex);

const maxBalance = 10000;

const store = new Vuex.Store({
  plugins: [veeValidate],
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
    name: 'input empty',
    error: true,
    value: '',
    displayed: '',
    currency: 0,
  },
  {
    name: 'input zero',
    error: true,
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
    name: 'input more than balance',
    error: true,
    value: maxBalance + 1,
    displayed: maxBalance + 1,
    currency: (maxBalance + 1) * 3,
  },
  {
    name: 'input float with token',
    token: { symbol: 'AR' },
    value: 0.1234567890,
    displayed: 0.1234567890,
    currency: 0,
  },
  {
    name: 'input token, without enough balance for fee',
    error: true,
    token: { symbol: 'AR' },
    value: 1,
    displayed: 1,
    currency: 0,
    balance: 0.000000001,
  },
  {
    name: 'input with noToken property set',
    error: true,
    token: { symbol: 'AR' },
    value: 1,
    displayed: 1,
    currency: 0,
    props: { noToken: true },
  },
  {
    name: 'input with validation property set',
    error: true,
    value: 1,
    displayed: 1,
    currency: 3,
    props: { validation: { min_value_exclusive: 2 } },
  },
  {
    name: 'input with validation and ownValidation properties set',
    value: 2,
    displayed: 2,
    currency: 6,
    props: { validation: { min_value_exclusive: 0 }, ownValidation: true },
    balance: 1,
  }].forEach((test) => it(test.name, async () => {
    store.commit('fungibleTokens/setToken', test.token || null);
    const wrapper = mount(InputAmount, {
      computed: {
        max() { return test.balance || maxBalance; },
      },
      store,
      attrs: { value: test.value },
      propsData: { ...test.props },
      data: () => ({ balance: BigNumber(test.balance || maxBalance) }),
    });

    // eslint-disable-next-line no-underscore-dangle
    store._vm.$validator.extend('enough_ae', (_, [arg]) => BigNumber(test.balance || maxBalance).isGreaterThanOrEqualTo(arg));
    expect(wrapper.find('input').element.value).toBe(test.displayed.toString());
    expect(wrapper.find('.token').text()).toBe(test.token?.symbol || 'AE');
    if (!store.getters['fungibleTokens/selectedToken']) {
      expect(wrapper.find('[data-cy=amount-currency]').text()).toBe(`(${test.currency.toFixed(2)})`);
    }
    // eslint-disable-next-line no-underscore-dangle
    /* await store._vm.$validator.validateAll(); TODO: be able to test errors
    if (test.error) {
      expect(wrapper.find('.message.error').exists()).toBeTruthy();
    } */
  }));
});
