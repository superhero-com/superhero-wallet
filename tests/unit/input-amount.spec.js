import Vue from 'vue';
import Vuex from 'vuex';
import BigNumber from 'bignumber.js';
import { mount } from '@vue/test-utils';
import InputAmount from '../../src/popup/components/InputAmount.vue';
import veeValidate from '../../src/store/plugins/veeValidate';
import { AETERNITY_SYMBOL, NETWORK_TESTNET } from '../../src/popup/utils';
import { testAccount } from '../../src/popup/utils/testsConfig';

Object.assign(Vue.prototype, {
  $t: () => 'locale-specific-text',
});

Vue.use(Vuex);

const maxBalance = 10000;

const store = new Vuex.Store({
  plugins: [veeValidate],
  getters: {
    account: () => testAccount,
    currentCurrencyRate: () => 3,
    formatCurrency: () => (value) => (+value).toFixed(2),
    activeNetwork: () => (NETWORK_TESTNET),
  },
});

describe('InputAmount', () => {
  it('should render', async () => {
    const wrapper = mount(InputAmount, {
      store,
    });
    expect(wrapper.classes()).toContain('input-amount');
  });

  [
    {
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
  ].forEach((test) => it(test.name, async () => {
    const wrapper = mount(InputAmount, {
      store,
      propsData: {
        value: test.value,
        ...test.props,
      },
    });

    store._vm.$validator.extend('enough_ae', (_, [arg]) => BigNumber(test.balance || maxBalance).isGreaterThanOrEqualTo(arg));
    expect(wrapper.find('input').element.value).toBe(test.displayed.toString());
    expect(wrapper.find('.token').text()).toBe(AETERNITY_SYMBOL);
    // expect(wrapper.find('[data-cy=amount-currency]').text())
    //   .toBe(`($${test.currency.toFixed(2)})`);

    /* await store._vm.$validator.validateAll(); TODO: be able to test errors
    if (test.error) {
      expect(wrapper.find('.message.error').exists()).toBeTruthy();
    } */
  }));
});
