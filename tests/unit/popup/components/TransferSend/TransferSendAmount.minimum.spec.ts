/**
 * [BLACK-BOX] Bitcoin mainnet nodes don't relay outputs under 546 sat (dust), so the send
 * form stops such an amount on mainnet; 546 sat itself is not dust. A form without a minimum
 * of its own still rejects 0. Runs the app's real validation rules.
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import type { Component } from 'vue';

import '@/protocols/registerAdapters';
import type { Protocol } from '@/types';
import { NETWORK_NAME_MAINNET, NETWORK_NAME_TESTNET, PROTOCOLS } from '@/constants';
import { useNetworks } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { i18n } from '@/popup/plugins/i18n';
import initVeeValidateRules from '@/popup/plugins/veeValidate';
import BtcTransferSendForm from '@/protocols/bitcoin/components/TransferSendForm.vue';
import DogeTransferSendForm from '@/protocols/dogecoin/components/TransferSendForm.vue';

// The setup files already loaded the composables with the real balances; reload them.
vi.hoisted(() => vi.resetModules());

// Covers every amount and fee below.
vi.mock('@/composables/balances', async () => {
  const { ref } = await import('vue');
  const { default: BigNumber } = await import('bignumber.js');
  return {
    useBalances: () => ({ balance: ref(new BigNumber(1)), updateBalances: async () => {} }),
  };
});

// Offline: requests never settle, so the forms keep their default fees.
vi.stubGlobal('fetch', () => new Promise(() => {}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { render: () => null } }],
});

enableAutoUnmount(afterEach);

beforeAll(() => {
  initVeeValidateRules();
});

/** Types the amount and returns the message shown under the amount field. */
async function getAmountMessage(form: Component, protocol: Protocol, amount: string) {
  const wrapper = mount(form, {
    props: {
      transferData: {
        addresses: [],
        selectedAsset: ProtocolAdapterFactory.getAdapter(protocol).getDefaultCoin(),
      },
    },
    global: {
      plugins: [i18n, router],
      // No account is active, and the recipient plays no part in the amount.
      stubs: { AccountItem: { render: () => null }, TransferSendRecipient: true },
    },
  });
  await wrapper.find('[data-cy=amount] [data-cy=input]').setValue(amount);
  await flushPromises();
  const message = wrapper.find('[data-cy=amount] [data-cy=input-field-message]');
  return message.exists() ? message.text() : '';
}

describe('Bitcoin send form on mainnet', () => {
  it('rejects 545 sat as dust', async () => {
    expect(await getAmountMessage(BtcTransferSendForm, PROTOCOLS.bitcoin, '0.00000545'))
      .toBe('Amount must be 0.00000546 or more.');
  });

  it.each(['0.00000546', '0.00000547'])('accepts %s BTC', async (amount) => {
    expect(await getAmountMessage(BtcTransferSendForm, PROTOCOLS.bitcoin, amount)).toBe('');
  });
});

describe('Bitcoin send form on testnet', () => {
  beforeAll(() => useNetworks().switchNetwork(NETWORK_NAME_TESTNET));
  afterAll(() => useNetworks().switchNetwork(NETWORK_NAME_MAINNET));

  it('accepts 545 sat', async () => {
    expect(await getAmountMessage(BtcTransferSendForm, PROTOCOLS.bitcoin, '0.00000545')).toBe('');
  });
});

describe('Dogecoin send form, which sets no minimum of its own', () => {
  it('rejects 0', async () => {
    expect(await getAmountMessage(DogeTransferSendForm, PROTOCOLS.dogecoin, '0'))
      .toBe('Amount must be more than 0.');
  });
});
