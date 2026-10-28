/**
 * [BLACK-BOX] The send form's title names the network, not the coin: a token sent on
 * BNB Smart Chain must not read "Send BNB".
 */
import { shallowMount } from '@vue/test-utils';

import type { Protocol } from '@/types';
import { PROTOCOLS } from '@/constants';
import { i18n } from '@/popup/plugins/i18n';
import TransferSendFormBase from '@/popup/components/TransferSendFormBase.vue';
import ModalHeader from '@/popup/components/ModalHeader.vue';

function getTitle(protocol: Protocol, customTitle?: string) {
  const wrapper = shallowMount(TransferSendFormBase, {
    props: { protocol, customTitle, feeSymbol: '' },
    global: {
      plugins: [i18n],
      stubs: {
        ModalHeader: false,
        // No account is active here, and the title doesn't depend on one.
        AccountItem: { render: () => null },
      },
    },
  });
  return wrapper.findComponent(ModalHeader).text();
}

describe('TransferSendFormBase title', () => {
  it.each([
    [PROTOCOLS.ethereum, 'Send on Ethereum'],
    [PROTOCOLS.bnb, 'Send on BNB Smart Chain'],
    [PROTOCOLS.aeternity, 'Send on æternity'],
  ])('names the %s network', (protocol, title) => {
    expect(getTitle(protocol)).toBe(title);
  });

  it('shows the custom title instead', () => {
    expect(getTitle(PROTOCOLS.aeternity, 'Send funds from AirGap account'))
      .toBe('Send funds from AirGap account');
  });
});
