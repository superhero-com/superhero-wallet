import BigNumber from 'bignumber.js';
import { config, mount } from '@vue/test-utils';
import { defineRule } from 'vee-validate';
import InputAmount from '../../src/popup/components/InputAmount.vue';
import { AE_SYMBOL } from '../../src/protocols/aeternity/config';
import { PROTOCOL_AETERNITY } from '../../src/constants';

const maxBalance = 10000;

config.global = {
  mocks: {
    $t: () => 'locale-specific-text',
  },
};

describe('InputAmount', () => {
  it('should render', async () => {
    const wrapper = mount(InputAmount, { props: { protocol: PROTOCOL_AETERNITY } });
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
      props: {
        modelValue: test.value,
        protocol: PROTOCOL_AETERNITY,
        ...test.props,
      },
    });
    defineRule('enough_coin', (_, arg) => BigNumber(test.balance || maxBalance).isGreaterThanOrEqualTo(arg[0]));

    expect(wrapper.find('input').element.value).toBe(test.displayed.toString());
    expect(wrapper.find('[data-cy=select-asset]').text()).toBe(AE_SYMBOL);

    // expect(wrapper.find('[data-cy=amount-currency]').text())
    //   .toBe(`($${test.currency.toFixed(2)})`);

    /* await store._vm.$validator.validateAll(); TODO: be able to test errors
    if (test.error) {
      expect(wrapper.find('.message.error').exists()).toBeTruthy();
    } */
  }));
});
