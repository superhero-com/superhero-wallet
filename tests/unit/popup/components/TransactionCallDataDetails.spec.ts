import { enableAutoUnmount, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

import TransactionCallDataDetails from '@/popup/components/TransactionCallDataDetails.vue';
import en from '@/popup/locales/en-US.json';

enableAutoUnmount(afterEach);

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

const ADDRESS = '0x000000000000000000000000000000000000dEaD';

function mountDetails(args: Record<string, unknown>) {
  return mount(TransactionCallDataDetails, {
    props: {
      callData: '0x095ea7b3',
      callDataDecoded: { functionName: 'approve', args },
    },
    global: { plugins: [i18n] },
  });
}

describe('TransactionCallDataDetails', () => {
  it('shows every digit of a decoded integer', () => {
    const max = 2n ** 256n - 1n;
    const wrapper = mountDetails({ 0: ADDRESS, 1: max });

    expect(wrapper.text()).toContain(max.toString());
  });

  it('shows the integers inside a decoded struct and array', () => {
    const big = 2n ** 200n;
    // As web3 decodes a tuple and a uint256[]
    const wrapper = mountDetails({ 0: { 0: ADDRESS, 1: big, __length__: 2 }, 1: [7n] });

    expect(wrapper.text()).toContain(`"1": "${big}"`);
    expect(wrapper.text()).toContain('"7"');
  });
});
