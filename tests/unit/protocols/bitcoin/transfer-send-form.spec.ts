/**
 * [BLACK-BOX] The send form of Bitcoin, which Dogecoin uses too. Bitcoin mainnet nodes don't
 * relay outputs under 546 sat (dust), so the form stops such an amount on mainnet; 546 sat
 * itself is not dust. Dogecoin outputs under 0.01 DOGE need an extra fee, so it starts there.
 * Runs the app's real validation rules.
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { payments } from 'bitcoinjs-lib';

import '@/protocols/registerAdapters';
import type { Protocol } from '@/types';
import { NETWORK_NAME_MAINNET, NETWORK_NAME_TESTNET, PROTOCOLS } from '@/constants';
import { useNetworks } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { i18n } from '@/popup/plugins/i18n';
import initVeeValidateRules from '@/popup/plugins/veeValidate';
import TransferSendForm from '@/protocols/bitcoin/components/TransferSendForm.vue';
import TransferSendFormBase from '@/popup/components/TransferSendFormBase.vue';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import TransactionSpeedPicker from '@/popup/components/TransactionSpeedPicker.vue';
import BtnMaxAmount from '@/popup/components/buttons/BtnMaxAmount.vue';

// The setup files already loaded the composables with the real balances; reload them.
const { realAccounts, sender } = vi.hoisted(() => {
  vi.resetModules();
  return {
    realAccounts: { useAccounts: () => ({}) },
    sender: { address: '' },
  };
});

// Covers every amount and fee below.
vi.mock('@/composables/balances', async () => {
  const { ref } = await import('vue');
  const { default: BigNumber } = await import('bignumber.js');
  return {
    useBalances: () => ({ balance: ref(new BigNumber(1)), updateBalances: async () => {} }),
  };
});

// No account is active unless a test sets the sender. The real store is loaded in
// `beforeAll`: loading it here would bind the composables barrel to it.
vi.mock('@/composables/accounts', async () => {
  const { ref } = await import('vue');
  return {
    useAccounts: () => ({
      ...realAccounts.useAccounts(),
      ...sender.address
        ? { activeAccount: ref({ protocol: PROTOCOLS.bitcoin, address: sender.address }) }
        : {},
    }),
  };
});

// Offline: requests never settle, so the forms keep their default fees.
vi.stubGlobal('fetch', () => new Promise(() => {}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { render: () => null } }],
});

enableAutoUnmount(afterEach);

beforeAll(async () => {
  realAccounts.useAccounts = (
    await vi.importActual<typeof import('@/composables/accounts')>('@/composables/accounts')
  ).useAccounts;
  initVeeValidateRules();
});

function mountForm(protocol: Protocol, stubs = {}, addresses: string[] = []) {
  return mount(TransferSendForm, {
    props: {
      protocol,
      transferData: {
        addresses,
        selectedAsset: ProtocolAdapterFactory.getAdapter(protocol).getDefaultCoin(),
      },
    },
    global: {
      plugins: [i18n, router],
      stubs: { AccountItem: { render: () => null }, ...stubs },
    },
  });
}

/** Types the amount and returns the message shown under the amount field. */
async function getAmountMessage(protocol: Protocol, amount: string) {
  // The recipient plays no part in the amount.
  const wrapper = mountForm(protocol, { TransferSendRecipient: true });
  await wrapper.find('[data-cy=amount] [data-cy=input]').setValue(amount);
  await flushPromises();
  const message = wrapper.find('[data-cy=amount] [data-cy=input-field-message]');
  return message.exists() ? message.text() : '';
}

/** The fee of every recipient's send together, as the review gets it. */
function getFee(wrapper: ReturnType<typeof mountForm>) {
  return wrapper.findComponent(TransferSendFormBase).props('fee');
}

/** The slow, medium and fast fee of all the sends together, as the speed picker gets them. */
function getSpeedFees(wrapper: ReturnType<typeof mountForm>) {
  return wrapper.findComponent(TransactionSpeedPicker).props('feeList')
    .map(({ fee }: any) => fee.toFixed());
}

function getAmountInput(wrapper: ReturnType<typeof mountForm>) {
  return wrapper.find<HTMLInputElement>('[data-cy=amount] [data-cy=input]');
}

/** Answers the fee estimates of the node; any other request never settles. */
function stubFeeEstimates(rate: number) {
  vi.stubGlobal('fetch', (url: string) => (String(url).endsWith('/fee-estimates')
    ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ 5: rate }) })
    : new Promise(() => {})));
}

describe('Bitcoin send form on mainnet', () => {
  it('rejects 545 sat as dust', async () => {
    expect(await getAmountMessage(PROTOCOLS.bitcoin, '0.00000545'))
      .toBe('Amount must be 0.00000546 or more.');
  });

  it.each(['0.00000546', '0.00000547'])('accepts %s BTC', async (amount) => {
    expect(await getAmountMessage(PROTOCOLS.bitcoin, amount)).toBe('');
  });
});

describe('Bitcoin send form on testnet', () => {
  beforeAll(() => useNetworks().switchNetwork(NETWORK_NAME_TESTNET));
  afterAll(() => useNetworks().switchNetwork(NETWORK_NAME_MAINNET));

  it('accepts 545 sat', async () => {
    expect(await getAmountMessage(PROTOCOLS.bitcoin, '0.00000545')).toBe('');
  });
});

describe('Dogecoin send form on mainnet', () => {
  it.each(['0', '0.00999999'])('rejects %s DOGE', async (amount) => {
    expect(await getAmountMessage(PROTOCOLS.dogecoin, amount)).toBe('Amount must be 0.01 or more.');
  });

  it('accepts 0.01 DOGE', async () => {
    expect(await getAmountMessage(PROTOCOLS.dogecoin, '0.01')).toBe('');
  });
});

describe('Dogecoin send form on testnet', () => {
  beforeAll(() => useNetworks().switchNetwork(NETWORK_NAME_TESTNET));
  afterAll(() => useNetworks().switchNetwork(NETWORK_NAME_MAINNET));

  it('rejects 0.00999999 DOGE', async () => {
    expect(await getAmountMessage(PROTOCOLS.dogecoin, '0.00999999'))
      .toBe('Amount must be 0.01 or more.');
  });
});

describe('Send form recipient', () => {
  it.each([PROTOCOLS.bitcoin, PROTOCOLS.dogecoin])('asks for a %s address', async (protocol) => {
    const wrapper = mountForm(protocol);
    await flushPromises();
    expect(wrapper.find('[data-cy=address] textarea').attributes('placeholder'))
      .toBe(`Enter ${protocol} address`);
  });
});

describe('Bitcoin send form fee', () => {
  const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.bitcoin) as any;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', () => new Promise(() => {}));
  });

  it('sizes the fee again soon after the amount changes', async () => {
    stubFeeEstimates(10);
    const estimateSendsVsizes = vi.spyOn(adapter, 'estimateSendsVsizes')
      .mockImplementation(async (amount: any, recipient: any, feeRates: any) => (
        feeRates.map(() => [amount > 0.0001 ? 276 : 141])
      ));

    const wrapper = mountForm(PROTOCOLS.bitcoin, { TransferSendRecipient: true });
    await vi.advanceTimersByTimeAsync(100);
    await getAmountInput(wrapper).setValue('0.00045');
    // Well before the next 5 s poll
    await vi.advanceTimersByTimeAsync(1000);

    expect(estimateSendsVsizes.mock.lastCall![0]).toBe(0.00045);
    expect(getFee(wrapper)).toBe(0.0000276);
  });

  it('keeps the fee of the latest amount when an older sizing finishes last', async () => {
    stubFeeEstimates(10);
    let finishFirst: (vsizes: number[][]) => void;
    vi.spyOn(adapter, 'estimateSendsVsizes')
      .mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve; }))
      .mockResolvedValue([[276], [276], [276]]);

    const wrapper = mountForm(PROTOCOLS.bitcoin, { TransferSendRecipient: true });
    await vi.advanceTimersByTimeAsync(100);
    await getAmountInput(wrapper).setValue('0.00045');
    await vi.advanceTimersByTimeAsync(1000);
    finishFirst!([[141], [141], [141]]);
    await flushPromises();

    expect(getFee(wrapper)).toBe(0.0000276);
  });

  it('shows the fee when every sizing takes longer than the 5 s poll', async () => {
    stubFeeEstimates(10);
    vi.spyOn(adapter, 'estimateSendsVsizes')
      .mockImplementation((amount: any, recipient: any, feeRates: any) => new Promise((resolve) => {
        setTimeout(() => resolve(feeRates.map(() => [276])), 6000);
      }));

    const wrapper = mountForm(PROTOCOLS.bitcoin, { TransferSendRecipient: true });
    await vi.advanceTimersByTimeAsync(7000);

    expect(getFee(wrapper)).toBe(0.0000276);
  });

  it('settles the fee and amount of a Max send', async () => {
    stubFeeEstimates(10);
    // Sending 0.99998 BTC or more takes a third input; Max spends all three.
    const estimateSendsVsizes = vi.spyOn(adapter, 'estimateSendsVsizes')
      .mockImplementation(async (amount: any, recipient: any, feeRates: any, { sweep }: any) => (
        feeRates.map(() => [(sweep || amount >= 0.99998) ? 246 : 178])
      ));

    const wrapper = mountForm(PROTOCOLS.bitcoin, { TransferSendRecipient: true });
    await vi.advanceTimersByTimeAsync(100);
    const callsBeforeMax = estimateSendsVsizes.mock.calls.length;
    await wrapper.find('[data-cy=amount] .max-button').trigger('click');
    await vi.advanceTimersByTimeAsync(10000);

    expect(getFee(wrapper)).toBe(0.0000246);
    expect(getAmountInput(wrapper).element.value).toBe('0.9999754');
    const maxSweeps = estimateSendsVsizes.mock.calls.slice(callsBeforeMax)
      .map(([, , , { sweep }]: any) => sweep);
    expect(maxSweeps.length).toBeGreaterThan(0);
    expect(maxSweeps.every((sweep) => sweep)).toBe(true);
  });

  it('sizes the fee again soon after Max is turned off', async () => {
    stubFeeEstimates(10);
    const estimateSendsVsizes = vi.spyOn(adapter, 'estimateSendsVsizes')
      .mockImplementation(async (amount: any, recipient: any, feeRates: any) => (
        feeRates.map(() => [246])
      ));

    const wrapper = mountForm(PROTOCOLS.bitcoin, { TransferSendRecipient: true });
    await vi.advanceTimersByTimeAsync(100);
    await wrapper.find('[data-cy=amount] .max-button').trigger('click');
    await vi.advanceTimersByTimeAsync(1000);
    // The amount stays
    await wrapper.find('[data-cy=amount] .max-button').trigger('click');
    // Well before the next 5 s poll
    await vi.advanceTimersByTimeAsync(1000);

    expect(estimateSendsVsizes.mock.lastCall![3]).toMatchObject({ sweep: false });
  });

  it('drops a pending sizing when the form closes', async () => {
    stubFeeEstimates(10);
    const estimateSendsVsizes = vi.spyOn(adapter, 'estimateSendsVsizes').mockResolvedValue([[276], [276], [276]]);

    const wrapper = mountForm(PROTOCOLS.bitcoin, { TransferSendRecipient: true });
    await vi.advanceTimersByTimeAsync(100);
    await getAmountInput(wrapper).setValue('0.00045');
    wrapper.unmount();
    const callsOnClose = estimateSendsVsizes.mock.calls.length;
    await vi.advanceTimersByTimeAsync(1000);

    expect(estimateSendsVsizes).toHaveBeenCalledTimes(callsOnClose);
  });

  it('keeps an amount typed after Max', async () => {
    stubFeeEstimates(10);
    // Sent with every input, an amount under the balance would leave change.
    vi.spyOn(adapter, 'estimateSendsVsizes')
      .mockImplementation(async (amount: any, recipient: any, feeRates: any, { sweep }: any) => (
        feeRates.map(() => [(sweep && amount < 0.9) ? 277 : 246])
      ));

    const wrapper = mountForm(PROTOCOLS.bitcoin, { TransferSendRecipient: true });
    await vi.advanceTimersByTimeAsync(100);
    await wrapper.find('[data-cy=amount] .max-button').trigger('click');
    await vi.advanceTimersByTimeAsync(1000);
    await getAmountInput(wrapper).setValue('0.3');
    await vi.advanceTimersByTimeAsync(10000);

    expect(getAmountInput(wrapper).element.value).toBe('0.3');
    expect(wrapper.findComponent(BtnMaxAmount).props('isMax')).toBe(false);
  });

  describe('with the node answering', () => {
    const bc1q = (byte: number) => payments.p2wpkh({ hash: Buffer.alloc(20, byte) }).address!;
    const SENDER = bc1q(1);
    const RECIPIENTS = [bc1q(2), bc1q(3)];

    const mountTo = (addresses: string[]) => mountForm(
      PROTOCOLS.bitcoin,
      { TransferSendRecipient: true },
      addresses,
    );

    /** Answers the fee estimates and the UTXOs of the sender only, or `utxos` as is. */
    function stubNode(rate: number, utxos: number[] | object) {
      const { nodeUrl } = useNetworks().activeNetwork.value.protocols.bitcoin;
      const answer = (body: any) => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(body),
      });
      vi.stubGlobal('fetch', (url: string) => {
        if (url === `${nodeUrl}/fee-estimates`) {
          return answer({ 5: rate });
        }
        if (url === `${nodeUrl}/address/${SENDER}/utxo`) {
          return answer(Array.isArray(utxos)
            ? utxos.map((value, vout) => ({ txid: 'ab'.repeat(32), vout, value }))
            : utxos);
        }
        return new Promise(() => {});
      });
    }

    beforeEach(() => {
      sender.address = SENDER;
    });

    afterEach(() => {
      sender.address = '';
    });

    it.each([
      // Every input and change at each speed: 277 vB
      [[20_000, 20_000, 20_000], 10, '0.00045', ['0.00001385', '0.0000277', '0.00004155']],
      // The slow fee leaves change, 141 vB; the others leave none, 110 vB
      [[100_000], 20, '0.000975', ['0.0000141', '0.000022', '0.000033']],
    ])('sizes each speed for the inputs and change of its own fee: %j at %i sat/vB', async (
      utxos,
      rate,
      amount,
      fees,
    ) => {
      stubNode(rate, utxos);

      const wrapper = mountTo(RECIPIENTS.slice(0, 1));
      await getAmountInput(wrapper).setValue(amount);
      await vi.advanceTimersByTimeAsync(1000);

      expect(getSpeedFees(wrapper)).toEqual(fees);
    });

    it('rounds the fees of a fractional rate up to whole satoshis', async () => {
      // One input and change, 141 vB, at 6.25, 12.5 and 18.75 sat/vB
      stubNode(12.5, [100_000]);

      const wrapper = mountTo(RECIPIENTS.slice(0, 1));
      await getAmountInput(wrapper).setValue('0.0005');
      await vi.advanceTimersByTimeAsync(1000);

      expect(getSpeedFees(wrapper)).toEqual(['0.00000882', '0.00001763', '0.00002644']);
    });

    it('sizes a Max send without change', async () => {
      // The whole 1 BTC balance in one UTXO
      stubNode(20, [100_000_000]);

      const wrapper = mountTo(RECIPIENTS.slice(0, 1));
      await vi.advanceTimersByTimeAsync(100);
      await wrapper.find('[data-cy=amount] .max-button').trigger('click');
      await vi.advanceTimersByTimeAsync(10000);

      // One input and the payment, 110 vB
      expect(getFee(wrapper)).toBe(0.000022);
      expect(getAmountInput(wrapper).element.value).toBe('0.999978');
    });

    it('sizes the fee again soon after the recipient is replaced by one of another type', async () => {
      stubNode(20, [100_000]);
      const wrapper = mountTo(RECIPIENTS.slice(0, 1));
      await getAmountInput(wrapper).setValue('0.0005');
      await vi.advanceTimersByTimeAsync(1000);
      // One input and change, 141 vB
      expect(getFee(wrapper)).toBe(0.0000282);

      const p2wsh = payments.p2wsh({ hash: Buffer.alloc(32, 5) }).address!;
      wrapper.findComponent(TransferSendRecipient).vm.$emit('update:modelValue', [p2wsh]);
      // Well before the next 5 s poll
      await vi.advanceTimersByTimeAsync(1000);

      // The P2WSH payment is 12 vB larger
      expect(getFee(wrapper)).toBe(0.0000306);
    });

    it('keeps the default fee when the node answers the UTXOs with an error', async () => {
      stubNode(20, { error: 'Too many requests' });

      const wrapper = mountTo(RECIPIENTS.slice(0, 1));
      await getAmountInput(wrapper).setValue('0.0005');
      await vi.advanceTimersByTimeAsync(1000);

      expect(getSpeedFees(wrapper)).toEqual(['0.00002', '0.00002', '0.00002']);
    });

    describe('to two recipients', () => {
      // At 20 sat/vB the first send takes 100,000 sat whole, 110 vB. The second leaves
      // change on 500,000 sat, 141 vB.
      const UTXOS = [97_800, 100_000, 500_000];

      it('sizes each send for what the one before left', async () => {
        stubNode(20, UTXOS);

        const wrapper = mountTo(RECIPIENTS);
        await getAmountInput(wrapper).setValue('0.000975');
        await vi.advanceTimersByTimeAsync(1000);

        expect(getFee(wrapper)).toBe(0.0000502);
      });

      it('sizes the sends while a pasted recipient is not an address', async () => {
        stubNode(20, UTXOS);

        const wrapper = mountTo([RECIPIENTS[0], 'bc1qnotanaddress']);
        await getAmountInput(wrapper).setValue('0.000975');
        await vi.advanceTimersByTimeAsync(1000);

        // As two P2WPKH recipients, until it is replaced
        expect(getFee(wrapper)).toBe(0.0000502);
      });

      it('hands the review the fee of each send, which add up to the fee shown', async () => {
        // The first send takes 110,000 sat with change, 141 vB. The second takes every
        // 10,000 sat UTXO and that change, 11 inputs, and pays for change too: 821 vB.
        stubNode(10, [110_000, ...Array(10).fill(10_000)]);

        const wrapper = mountTo(RECIPIENTS);
        await getAmountInput(wrapper).setValue('0.001');
        await vi.advanceTimersByTimeAsync(1000);
        await (wrapper.vm as any).submit();

        const [transferData] = wrapper.emitted('update:transferData')!.at(-1)! as any[];
        expect(transferData.fee.toNumber()).toBe(0.0000962);
        expect(transferData.fees).toEqual([0.0000141, 0.0000821]);
      });

      it('hands the review no fees sized for another number of recipients', async () => {
        stubNode(20, UTXOS);
        const wrapper = mountTo(RECIPIENTS.slice(0, 1));
        await getAmountInput(wrapper).setValue('0.000975');
        await vi.advanceTimersByTimeAsync(1000);

        wrapper.findComponent(TransferSendRecipient).vm.$emit('update:modelValue', RECIPIENTS);
        await (wrapper.vm as any).submit();

        const [transferData] = wrapper.emitted('update:transferData')!.at(-1)! as any[];
        expect(transferData.fees).toBeUndefined();
        // The fee of one send for each, until both are sized
        expect(transferData.fee.toNumber()).toBe(0.000044);
      });

      it('sizes the fee again soon after the second recipient is added', async () => {
        stubNode(20, UTXOS);
        const wrapper = mountTo(RECIPIENTS.slice(0, 1));
        await getAmountInput(wrapper).setValue('0.000975');
        await vi.advanceTimersByTimeAsync(1000);
        expect(getFee(wrapper)).toBe(0.000022);

        wrapper.findComponent(TransferSendRecipient).vm.$emit('update:modelValue', RECIPIENTS);
        // Well before the next 5 s poll
        await vi.advanceTimersByTimeAsync(1000);

        expect(getFee(wrapper)).toBe(0.0000502);
      });

      it('hands the review a fee that a third recipient added since splits in whole satoshis', async () => {
        stubFeeEstimates(1);
        // The sends to two recipients pay 209 and 178 sat; three are not sized yet
        vi.spyOn(adapter, 'estimateSendsVsizes')
          .mockImplementation(async (amount: any, recipients: any, feeRates: any) => (
            recipients.length === 2 ? feeRates.map(() => [209, 178]) : new Promise(() => {})
          ));
        const wrapper = mountTo(RECIPIENTS);
        await vi.advanceTimersByTimeAsync(1000);
        expect(getFee(wrapper)).toBe(0.00000387);

        wrapper.findComponent(TransferSendRecipient).vm
          .$emit('update:modelValue', [...RECIPIENTS, bc1q(4)]);
        await (wrapper.vm as any).submit();

        const [transferData] = wrapper.emitted('update:transferData')!.at(-1)! as any[];
        expect(transferData.fees).toBeUndefined();
        // 194 sat for each, the larger share of the two
        expect(transferData.fee.toNumber()).toBe(0.00000582);
      });

      it('splits the balance of a Max send between them, less the fee of each send', async () => {
        // The first send leaves the second half as change, 141 vB; the second has none, 110 vB.
        stubNode(20, [100_000_000]);

        const wrapper = mountTo(RECIPIENTS);
        await vi.advanceTimersByTimeAsync(100);
        await wrapper.find('[data-cy=amount] .max-button').trigger('click');
        await vi.advanceTimersByTimeAsync(10000);
        await (wrapper.vm as any).submit();

        expect(getAmountInput(wrapper).element.value).toBe('0.4999749');
        const [transferData] = wrapper.emitted('update:transferData')!.at(-1)! as any[];
        expect(transferData.fees).toEqual([0.0000282, 0.000022]);
      });
    });
  });

  describe('on testnet', () => {
    beforeAll(() => useNetworks().switchNetwork(NETWORK_NAME_TESTNET));
    afterAll(() => useNetworks().switchNetwork(NETWORK_NAME_MAINNET));

    it('doubles the medium rate', async () => {
      stubFeeEstimates(10);
      const estimateSendsVsizes = vi.spyOn(adapter, 'estimateSendsVsizes').mockResolvedValue([[276], [276], [276]]);

      const wrapper = mountForm(PROTOCOLS.bitcoin, { TransferSendRecipient: true });
      await vi.advanceTimersByTimeAsync(100);

      expect(estimateSendsVsizes.mock.lastCall![2]).toEqual([5, 20, 15]);
      expect(getFee(wrapper)).toBe(0.0000552);
    });
  });
});

describe('Send form default fee', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', () => new Promise(() => {}));
  });

  it.each([
    [PROTOCOLS.bitcoin, 0.00002],
    [PROTOCOLS.dogecoin, 0.00226],
  ])('starts %s at %s', async (protocol, fee) => {
    const wrapper = mountForm(protocol);
    await flushPromises();
    expect(getFee(wrapper)).toBe(fee);
  });

  it('falls back to 1000 koinu/vB for Dogecoin', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    // Two inputs and change
    const estimateSendsVsizes = vi.spyOn(ProtocolAdapterFactory.getAdapter(PROTOCOLS.dogecoin) as any, 'estimateSendsVsizes')
      .mockResolvedValue([[374], [374], [374]]);

    const wrapper = mountForm(PROTOCOLS.dogecoin);
    await flushPromises();

    expect(estimateSendsVsizes.mock.lastCall![2]).toEqual([1000, 1000, 1500]);
    expect(getSpeedFees(wrapper)).toEqual(['0.00374', '0.00374', '0.00561']);
  });
});

describe('Dogecoin send form fee', () => {
  const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.dogecoin) as any;

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', () => new Promise(() => {}));
  });

  it('sizes the fee again soon after the amount changes', async () => {
    vi.useFakeTimers();
    stubFeeEstimates(1000);
    const estimateSendsVsizes = vi.spyOn(adapter, 'estimateSendsVsizes')
      .mockImplementation(async (amount: any, recipient: any, feeRates: any) => (
        feeRates.map(() => [amount > 0.1 ? 374 : 226])
      ));

    const wrapper = mountForm(PROTOCOLS.dogecoin, { TransferSendRecipient: true });
    await vi.advanceTimersByTimeAsync(100);
    await getAmountInput(wrapper).setValue('0.5');
    // Well before the next 5 s poll
    await vi.advanceTimersByTimeAsync(1000);

    expect(estimateSendsVsizes.mock.lastCall![0]).toBe(0.5);
    expect(getFee(wrapper)).toBe(0.00374);
  });

  it.each([
    [400, [1000, 1000, 1000], ['0.00226', '0.00226', '0.00226']],
    // The fast fee takes a second input
    [1500, [1000, 1500, 2250], ['0.00226', '0.00339', '0.008415']],
  ])('sizes every speed at 0.01 DOGE/kB or more when the API asks %i koinu/vB', async (
    rate,
    feeRates,
    fees,
  ) => {
    stubFeeEstimates(rate);
    const estimateSendsVsizes = vi.spyOn(adapter, 'estimateSendsVsizes')
      .mockImplementation(async (amount: any, recipient: any, rates: any) => (
        rates.map((feeRate: number) => [feeRate > 2000 ? 374 : 226])
      ));

    const wrapper = mountForm(PROTOCOLS.dogecoin);
    await flushPromises();

    expect(estimateSendsVsizes.mock.lastCall![2]).toEqual(feeRates);
    expect(getSpeedFees(wrapper)).toEqual(fees);
  });
});
