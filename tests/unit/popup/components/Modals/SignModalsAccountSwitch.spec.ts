import { computed, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import {
  AccountMemory, Encoded, Tag, buildTx, getTransactionSignerAddress,
} from '@aeternity/aepp-sdk';

import ConfirmRawSign from '@/popup/components/Modals/ConfirmRawSign.vue';
import ConfirmUnsafeSign from '@/popup/components/Modals/ConfirmUnsafeSign.vue';
import MessageSign from '@/popup/pages/Popups/MessageSign.vue';
import {
  useAccounts, useAeSdk, useModals, usePopupProps,
} from '@/composables';
import { PROTOCOLS } from '@/constants';
import en from '@/popup/locales/en-US.json';

// The Air Gap branch of `ConfirmRawSign.confirm()` only runs inside the popup.
vi.mock('@/constants', async (importOriginal) => ({
  ...await importOriginal<any>(),
  RUNNING_IN_POPUP: true,
}));

/**
 * Message / unsafe payloads carry no sender, so the wallet signs them with
 * whatever account is active. These specs pin down that the switcher actually
 * re-routes signing: the picked account is made active before the modal
 * resolves (a UX nicety), and is also carried explicitly in the `resolve()`
 * payload, which is what the signer actually reads to choose the signing key -
 * see `AeAccountHdWallet.signer.spec.ts` for why the active-account side
 * effect alone cannot be trusted for that.
 */

const ADDRESS_ACTIVE = 'ak_activeAccountAddress0000000000000000000000000000000';
const ADDRESS_OTHER = 'ak_otherAccountAddress00000000000000000000000000000000';

const accountActive = {
  protocol: PROTOCOLS.aeternity, address: ADDRESS_ACTIVE, idx: 0, globalIdx: 0, type: 'hd-wallet',
};
const accountOther = {
  protocol: PROTOCOLS.aeternity, address: ADDRESS_OTHER, idx: 1, globalIdx: 1, type: 'hd-wallet',
};

vi.mock('@/composables', () => ({
  useAccounts: vi.fn(),
  useAeSdk: vi.fn(),
  useModals: vi.fn(),
  usePopupProps: vi.fn(),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

const SignAccountSelectStub = {
  name: 'SignAccountSelect',
  props: ['account', 'protocol', 'label', 'originalAddress', 'signerAccountMissing'],
  template: '<div class="sign-account-select-stub" />',
};

let setActiveAccountByAddressAndProtocol: ReturnType<typeof vi.fn>;
let resolve: ReturnType<typeof vi.fn>;

function mountModal(component: any) {
  setActiveAccountByAddressAndProtocol = vi.fn();
  resolve = vi.fn();

  // @ts-ignore
  (usePopupProps as vi.Mock).mockReturnValue({
    isUnknownDapp: computed(() => false),
    setPopupProps: vi.fn(),
    sender: computed(() => ({ name: 'dapp.test', address: 'dapp.test', url: 'https://dapp.test/' })),
    popupProps: ref({
      protocol: PROTOCOLS.aeternity,
      txBase64: 'tx_someRawPayload',
      message: 'hello',
      app: {
        host: 'dapp.test', name: 'dapp.test', protocol: 'https:', href: 'https://dapp.test/',
      },
      resolve,
      reject: vi.fn(),
    }),
  });

  // @ts-ignore
  (useAccounts as vi.Mock).mockReturnValue({
    getLastActiveProtocolAccount: vi.fn(() => accountActive),
    getAccountByProtocolAndAddress: vi.fn(),
    setActiveAccountByAddressAndProtocol,
  });

  // @ts-ignore
  (useModals as vi.Mock).mockReturnValue({ openModal: vi.fn() });

  return mount(component, {
    global: {
      plugins: [i18n],
      stubs: {
        Modal: { template: '<div><slot /><slot name="footer" /></div>' },
        SignAccountSelect: SignAccountSelectStub,
        TransactionInfo: true,
        NoOriginWarning: true,
        DetailsItem: true,
        CopyText: true,
        BtnMain: true,
      },
    },
  });
}

const cases = [
  { name: 'ConfirmUnsafeSign', component: ConfirmUnsafeSign, confirmFn: 'confirm' },
  { name: 'MessageSign', component: MessageSign, confirmFn: 'approve' },
];

describe.each(cases)('$name account switcher', ({ component, confirmFn }) => {
  it('offers the switcher, defaulted to the active account', () => {
    const wrapper = mountModal(component);
    const select = wrapper.findComponent(SignAccountSelectStub);

    expect(select.exists()).toBe(true);
    expect(select.props('account')).toEqual(accountActive);
    expect(select.props('protocol')).toBe(PROTOCOLS.aeternity);
    // No sender is baked into these payloads, so there is nothing to warn about.
    expect(select.props('originalAddress')).toBeUndefined();
  });

  it('makes the picked account active before resolving, so the UI reflects it', async () => {
    const wrapper = mountModal(component);

    await wrapper.findComponent(SignAccountSelectStub).vm.$emit('select', accountOther);
    await (wrapper.vm as any)[confirmFn]();

    expect(setActiveAccountByAddressAndProtocol).toHaveBeenCalledWith(
      ADDRESS_OTHER,
      PROTOCOLS.aeternity,
    );
    expect(resolve).toHaveBeenCalled();
  });

  it('resolves with the picked address, which is what the signer actually reads', async () => {
    const wrapper = mountModal(component);

    await wrapper.findComponent(SignAccountSelectStub).vm.$emit('select', accountOther);
    await (wrapper.vm as any)[confirmFn]();

    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({ selectedAddress: ADDRESS_OTHER }),
    );
  });

  it('keeps the active account when the user does not switch', async () => {
    const wrapper = mountModal(component);

    await (wrapper.vm as any)[confirmFn]();

    expect(setActiveAccountByAddressAndProtocol).toHaveBeenCalledWith(
      ADDRESS_ACTIVE,
      PROTOCOLS.aeternity,
    );
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({ selectedAddress: ADDRESS_ACTIVE }),
    );
  });
});

/**
 * `ConfirmRawSign` is also used for raw-sign-routed transactions that are
 * still valid, parseable txs (e.g. a NameRevokeTx) - just of a type the wallet
 * has no dedicated UI for - so it carries the same "prepared for a specific
 * account" and rebuild-gating logic as `ConfirmTransactionSign`.
 */
describe('ConfirmRawSign account switcher', () => {
  const ADDRESS_PREPARED = AccountMemory.generate().address;
  const ADDRESS_RECIPIENT = AccountMemory.generate().address;
  const accountPrepared = {
    protocol: PROTOCOLS.aeternity, address: ADDRESS_PREPARED, idx: 2, globalIdx: 2, type: 'hd-wallet',
  };

  const buildSpendTxFor = (senderId: Encoded.AccountAddress) => buildTx({
    tag: Tag.SpendTx,
    senderId,
    recipientId: ADDRESS_RECIPIENT,
    amount: 1e18,
    fee: 20000000000000,
    nonce: 1,
    payload: 'ba_Xfbg4g==',
  }) as Encoded.Transaction;

  function mountRawSign(txBase64: Encoded.Transaction) {
    setActiveAccountByAddressAndProtocol = vi.fn();
    resolve = vi.fn();

    // @ts-ignore
    (usePopupProps as vi.Mock).mockReturnValue({
      isUnknownDapp: computed(() => false),
      setPopupProps: vi.fn(),
      sender: computed(() => ({ name: 'dapp.test', address: 'dapp.test', url: 'https://dapp.test/' })),
      popupProps: ref({
        protocol: PROTOCOLS.aeternity,
        txBase64,
        app: {
          host: 'dapp.test', name: 'dapp.test', protocol: 'https:', href: 'https://dapp.test/',
        },
        resolve,
        reject: vi.fn(),
      }),
    });

    // @ts-ignore
    (useAccounts as vi.Mock).mockReturnValue({
      getLastActiveProtocolAccount: vi.fn(() => accountActive),
      getAccountByProtocolAndAddress: vi.fn(
        (protocol: string, address: string) => [accountActive, accountOther, accountPrepared]
          .find((acc) => acc.protocol === protocol && acc.address === address),
      ),
      setActiveAccountByAddressAndProtocol,
    });

    // @ts-ignore
    (useAeSdk as vi.Mock).mockReturnValue({
      getAeSdk: vi.fn(async () => ({
        api: { getAccountNextNonce: vi.fn(async () => ({ nextNonce: 5 })) },
      })),
    });

    // @ts-ignore
    (useModals as vi.Mock).mockReturnValue({ openModal: vi.fn() });

    return mount(ConfirmRawSign, {
      global: {
        plugins: [i18n],
        stubs: {
          Modal: { template: '<div><slot /><slot name="footer" /></div>' },
          SignAccountSelect: SignAccountSelectStub,
          CheckBox: {
            name: 'CheckBox',
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template: '<div class="checkbox-stub" @click="$emit(\'update:modelValue\', !modelValue)" />',
          },
          TransactionInfo: true,
          NoOriginWarning: true,
          DetailsItem: true,
          CopyText: true,
          BtnMain: true,
          Warning: true,
        },
      },
    });
  }

  it('warns when prepared for an account other than the one selected', async () => {
    const wrapper = mountRawSign(buildSpendTxFor(ADDRESS_PREPARED));

    const select = wrapper.findComponent(SignAccountSelectStub);
    expect(select.props('originalAddress')).toBe(ADDRESS_PREPARED);
    expect(select.props('account')).toEqual(accountPrepared);
  });

  it('blocks confirming a switch until the user opts into rebuilding', async () => {
    const wrapper = mountRawSign(buildSpendTxFor(ADDRESS_PREPARED));

    await wrapper.findComponent(SignAccountSelectStub).vm.$emit('select', accountActive);
    expect((wrapper.vm as any).canSignWithSelectedAccount).toBe(false);

    await wrapper.find('[data-cy="rebuild-for-signer"]').trigger('click');
    expect((wrapper.vm as any).canSignWithSelectedAccount).toBe(true);
  });

  it('resolves with the rebuild opt-in for the signer to act on', async () => {
    const wrapper = mountRawSign(buildSpendTxFor(ADDRESS_PREPARED));

    await wrapper.findComponent(SignAccountSelectStub).vm.$emit('select', accountActive);
    await wrapper.find('[data-cy="rebuild-for-signer"]').trigger('click');
    await (wrapper.vm as any).confirm();

    expect(resolve).toHaveBeenCalledWith(expect.objectContaining({
      selectedAddress: ADDRESS_ACTIVE,
      rebuildForSelectedAccount: true,
    }));
  });

  it('lets a co-sign payload whose signer is not held be signed as-is', async () => {
    // A payload prepared for an account this wallet does not hold (a multisig /
    // state-channel co-sign, or an already-signed tx). v2.10.2 signed such raw
    // bytes as-is; the switcher must not strand it on a disabled Confirm.
    const ADDRESS_FOREIGN = AccountMemory.generate().address;
    const wrapper = mountRawSign(buildSpendTxFor(ADDRESS_FOREIGN));

    const select = wrapper.findComponent(SignAccountSelectStub);
    // The signer is flagged missing and Confirm is enabled without any rebuild.
    expect(select.props('signerAccountMissing')).toBe(true);
    expect((wrapper.vm as any).canSignWithSelectedAccount).toBe(true);
    // Re-pointing must not be offered - the exact bytes have to be signed.
    expect((wrapper.vm as any).isSignerReplaceable).toBe(false);
    expect(wrapper.find('[data-cy="rebuild-for-signer"]').exists()).toBe(false);
  });

  it('hands the Air Gap device the rebuilt transaction', async () => {
    // Rebuilding actually encodes/decodes the address, so it must be a real one -
    // unlike `ADDRESS_ACTIVE`, which is only ever compared by identity elsewhere.
    const ADDRESS_AIR_GAP = AccountMemory.generate().address;
    const wrapper = mountRawSign(buildSpendTxFor(ADDRESS_PREPARED));
    const accountAirGap = {
      protocol: PROTOCOLS.aeternity, address: ADDRESS_AIR_GAP, idx: 3, globalIdx: 3, type: 'airgap',
    };
    const { openModal } = (useModals as any)();

    await wrapper.findComponent(SignAccountSelectStub).vm.$emit('select', accountAirGap);
    await wrapper.find('[data-cy="rebuild-for-signer"]').trigger('click');
    await (wrapper.vm as any).confirm();

    const [, airGapProps] = openModal.mock.calls[0];
    expect(getTransactionSignerAddress(airGapProps.txRaw)).toBe(ADDRESS_AIR_GAP);
  });
});
