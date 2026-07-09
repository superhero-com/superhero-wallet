import { mount } from '@vue/test-utils';
import { Field, defineRule } from 'vee-validate';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';
import { PROTOCOLS } from '@/constants';
import { tg } from '@/popup/plugins/i18n';

/**
 * The real rule implementations live behind `src/popup/plugins/veeValidate.ts`'s
 * default export, which also boots `useBalances`/`useCurrencies`/`useAeSdk` - overkill
 * for testing how `TransferSendAmount` *builds* its rules object. Trivial pass-through
 * rules are enough to stop vee-validate's `Field` from throwing "no such validator"
 * while it validates in the background; none of the assertions below depend on the
 * validation outcome, only on props/computed values.
 */
beforeAll(() => {
  defineRule('required', () => true);
  defineRule('min_value_exclusive', () => true);
  defineRule('does_not_exceed_decimals', () => true);
  defineRule('max_value', () => true);
});

/**
 * `InputAmount` pulls in `useBalances`/`useCurrencies` (and, through those, live
 * currency rates) which are irrelevant to what `TransferSendAmount` itself is
 * responsible for: building the vee-validate `rules` object (decimals-aware) and
 * mapping the `errors` prop to a message. Stubbing it keeps the test focused and
 * lets us inspect exactly what props it receives.
 */
const InputAmountStub = {
  name: 'InputAmount',
  props: [
    'modelValue', 'name', 'label', 'message', 'protocol',
    'readonly', 'blinkOnChange', 'selectedAsset', 'withBalanceOnly',
  ],
  emits: ['update:modelValue', 'asset-selected'],
  template: '<div class="input-amount-stub" />',
};

function mountComponent(props = {}) {
  return mount(TransferSendAmount, {
    props: {
      protocol: PROTOCOLS.aeternity,
      errors: {},
      ...props,
    },
    global: {
      stubs: { InputAmount: InputAmountStub },
      mocks: { $t: (key) => key },
    },
  });
}

describe('TransferSendAmount', () => {
  it('forwards modelValue/protocol/readonly/blinkOnChange to InputAmount', () => {
    const wrapper = mountComponent({
      modelValue: '12.5',
      protocol: PROTOCOLS.bitcoin,
      readonly: true,
      blinkOnChange: true,
    });
    const input = wrapper.findComponent(InputAmountStub);

    expect(input.props('modelValue')).toBe('12.5');
    expect(input.props('protocol')).toBe(PROTOCOLS.bitcoin);
    expect(input.props('readonly')).toBe(true);
    expect(input.props('blinkOnChange')).toBe(true);
  });

  it('re-emits update:modelValue and asset-selected from InputAmount', async () => {
    const wrapper = mountComponent();
    const input = wrapper.findComponent(InputAmountStub);

    await input.vm.$emit('update:modelValue', '3');
    await input.vm.$emit('asset-selected', { symbol: 'AE' });

    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['3']);
    expect(wrapper.emitted('asset-selected')[0]).toEqual([{ symbol: 'AE' }]);
  });

  it("falls back to the protocol adapter's coin precision when no asset is selected", () => {
    const wrapperAe = mountComponent({ protocol: PROTOCOLS.aeternity });
    expect(wrapperAe.findComponent(Field).props('rules').does_not_exceed_decimals).toBe(18);

    const wrapperBtc = mountComponent({ protocol: PROTOCOLS.bitcoin });
    expect(wrapperBtc.findComponent(Field).props('rules').does_not_exceed_decimals).toBe(8);
  });

  it('uses the selected asset decimals instead of the protocol default when provided', () => {
    const wrapper = mountComponent({
      protocol: PROTOCOLS.aeternity,
      selectedAsset: { symbol: 'USDT', decimals: 6 },
    });

    expect(wrapper.findComponent(Field).props('rules').does_not_exceed_decimals).toBe(6);
    expect(wrapper.findComponent(InputAmountStub).props('selectedAsset')).toEqual({ symbol: 'USDT', decimals: 6 });
  });

  it('treats a selected asset with 0 decimals as explicit, not a missing value', () => {
    const wrapper = mountComponent({
      selectedAsset: { symbol: 'NFT', decimals: 0 },
    });

    expect(wrapper.findComponent(Field).props('rules').does_not_exceed_decimals).toBe(0);
  });

  it('always requires the amount and rejects non-positive values, merging in caller-provided rules', () => {
    const wrapper = mountComponent({
      validationRules: { max_value: [100] },
    });
    const rules = wrapper.findComponent(Field).props('rules');

    expect(rules.required).toBe(true);
    expect(rules.min_value_exclusive).toBe(0);
    expect(rules.max_value).toEqual([100]);
  });

  it('maps an empty errors.amount to a success message', () => {
    const wrapper = mountComponent({ errors: {} });
    expect(wrapper.findComponent(InputAmountStub).props('message')).toEqual({ status: 'success' });
  });

  it('maps a plain errors.amount to an error message', () => {
    const wrapper = mountComponent({ errors: { amount: tg('validation.required') } });
    expect(wrapper.findComponent(InputAmountStub).props('message')).toEqual({
      status: 'error',
      text: tg('validation.required'),
    });
  });

  it('flags a maxValueVault rule violation as a warning rather than a hard error', () => {
    const warningMessage = tg('validation.maxValueVault', ['1000']);
    const wrapper = mountComponent({ errors: { amount: warningMessage } });

    expect(wrapper.findComponent(InputAmountStub).props('message')).toEqual({
      status: 'warning',
      text: warningMessage,
    });
  });
});
