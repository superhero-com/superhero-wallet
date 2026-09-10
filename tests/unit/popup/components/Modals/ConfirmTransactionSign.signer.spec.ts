import { computed, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import {
  AccountMemory,
  Encoded,
  Tag,
  buildTx,
  getTransactionSignerAddress,
  unpackTx,
} from '@aeternity/aepp-sdk';

import ConfirmTransactionSign from '@/popup/components/Modals/ConfirmTransactionSign.vue';
import {
  useAccounts,
  useAeSdk,
  useFungibleTokens,
  useModals,
  usePopupProps,
  useTransactionData,
} from '@/composables';
import {
  ACCOUNT_TYPES,
  MODAL_SIGN_AIR_GAP_TRANSACTION,
  PROTOCOLS,
} from '@/constants';
import en from '@/popup/locales/en-US.json';

// The Air Gap branch of `confirm()` only runs inside the popup.
vi.mock('@/constants', async (importOriginal) => ({
  ...await importOriginal<any>(),
  RUNNING_IN_POPUP: true,
}));

/**
 * A transaction carries its sender, so only the account it was built for can
 * produce a signature the node accepts. These specs pin down that the modal
 * signs with that account - not with whatever happens to be active - which is
 * the deep-link case: the dapp prepares a transaction for account #1 while the
 * user has since switched the wallet to account #3.
 *
 * The transactions here are really encoded, so the modal runs the real
 * `getTransactionSignerAddress` / `canRebuildTransactionForSigner` against them
 * rather than a stubbed idea of what they contain.
 */

const ADDRESS_ACTIVE = AccountMemory.generate().address;
const ADDRESS_PREPARED = AccountMemory.generate().address;
const ADDRESS_FOREIGN = AccountMemory.generate().address;
const ADDRESS_RECIPIENT = AccountMemory.generate().address;

const accountActive = {
  protocol: PROTOCOLS.aeternity, address: ADDRESS_ACTIVE, idx: 0, globalIdx: 0, type: 'hd-wallet',
};
const accountPrepared = {
  protocol: PROTOCOLS.aeternity, address: ADDRESS_PREPARED, idx: 1, globalIdx: 1, type: 'hd-wallet',
};
const ADDRESS_AIR_GAP = AccountMemory.generate().address;
const accountAirGap = {
  protocol: PROTOCOLS.aeternity,
  address: ADDRESS_AIR_GAP,
  idx: 2,
  globalIdx: 2,
  type: ACCOUNT_TYPES.airGap,
};
const ADDRESS_EVM = '0x1111111111111111111111111111111111111111';
const accountEvm = {
  protocol: PROTOCOLS.ethereum, address: ADDRESS_EVM, idx: 0, globalIdx: 3, type: 'hd-wallet',
};
const walletAccounts = [accountActive, accountPrepared, accountAirGap, accountEvm];

/** A real SpendTx, encoded, sent by `senderId`. */
const buildSpendTxFor = (senderId: Encoded.AccountAddress) => buildTx({
  tag: Tag.SpendTx,
  senderId,
  recipientId: ADDRESS_RECIPIENT,
  amount: 1e18,
  fee: 20000000000000,
  nonce: 1,
  payload: 'ba_Xfbg4g==',
}) as Encoded.Transaction;

/** A real ContractCallTx, encoded, called by `callerId`. */
const buildContractCallTxFor = (callerId: Encoded.AccountAddress) => buildTx({
  tag: Tag.ContractCallTx,
  callerId,
  nonce: 1,
  contractId: 'ct_2rxYHp3GThDMMCoYZbFdjgUAeiKwFMhQ72ohYFt463t1A53knS',
  abiVersion: 3,
  fee: 200000000000000,
  amount: 0,
  gasLimit: 25000,
  gasPrice: 1000000000,
  callData: 'cb_KxFE1kQfP4oEp9E=',
}) as Encoded.Transaction;

vi.mock('@/composables', () => ({
  useAccounts: vi.fn(),
  useAeSdk: vi.fn(),
  useFungibleTokens: vi.fn(),
  useModals: vi.fn(),
  usePopupProps: vi.fn(),
  useTransactionData: vi.fn(),
}));

vi.mock('@/protocols/aeternity/composables', () => ({
  useAeNetworkSettings: vi.fn(() => ({
    aeActiveNetworkSettings: computed(() => ({ nodeUrl: 'https://node.test' })),
  })),
}));

vi.mock('@/protocols/aeternity/composables/aeTokenSales', () => ({
  useAeTokenSales: vi.fn(() => ({
    loadTokenSalesInfoByContractId: vi.fn(),
    tokenSaleAddressToTokenContractAddress: vi.fn(),
  })),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

const SignAccountSelectStub = {
  name: 'SignAccountSelect',
  props: ['account', 'protocol', 'label', 'originalAddress', 'signerAccountMissing'],
  template: '<div class="sign-account-select-stub" />',
};

const CheckBoxStub = {
  name: 'CheckBox',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="checkbox-stub" @click="$emit(\'update:modelValue\', !modelValue)" />',
};

let setActiveAccountByAddressAndProtocol: ReturnType<typeof vi.fn>;
let resolve: ReturnType<typeof vi.fn>;
let openModal: ReturnType<typeof vi.fn>;
let txDryRun: ReturnType<typeof vi.fn>;
let getAccountNextNonce: ReturnType<typeof vi.fn>;
let getAccountByPubkey: ReturnType<typeof vi.fn>;
let getBalance: ReturnType<typeof vi.fn>;

/** The shape `isNotFoundError` matches - a node 404 for an account with no history. */
const accountNotFound = Object.assign(new Error('Account not found'), { statusCode: 404 });

/** Node answers, set per test before `mountModal`, which rebuilds the mocks. */
const nodeState = {
  accountNonce: 7,
  nextNonce: 9,
  accountError: null as Error | null,
  nextNonceError: null as Error | null,
};

function mountModal(
  preparedFor: Encoded.AccountAddress = ADDRESS_PREPARED,
  popupPropsOverrides: Record<string, any> = {},
  dryRunResult: any = undefined,
) {
  setActiveAccountByAddressAndProtocol = vi.fn();
  resolve = vi.fn();
  openModal = vi.fn(async () => undefined);
  txDryRun = vi.fn(async () => dryRunResult);
  getAccountNextNonce = vi.fn(async () => {
    if (nodeState.nextNonceError) {
      throw nodeState.nextNonceError;
    }
    return { nextNonce: nodeState.nextNonce };
  });
  getAccountByPubkey = vi.fn(async () => {
    if (nodeState.accountError) {
      throw nodeState.accountError;
    }
    return { nonce: nodeState.accountNonce };
  });
  getBalance = vi.fn(async () => '1000000000000000000000');

  // @ts-ignore
  (usePopupProps as vi.Mock).mockReturnValue({
    isUnknownDapp: computed(() => false),
    setPopupProps: vi.fn(),
    popupProps: ref({
      protocol: PROTOCOLS.aeternity,
      txBase64: buildSpendTxFor(preparedFor),
      tx: { fee: '20000000000000', amount: '1000000000000000000' },
      app: {
        host: 'dapp.test', name: 'dapp.test', protocol: 'https:', href: 'https://dapp.test/',
      },
      resolve,
      reject: vi.fn(),
      ...popupPropsOverrides,
    }),
  });

  // @ts-ignore
  (useAccounts as vi.Mock).mockReturnValue({
    getLastActiveProtocolAccount: vi.fn(() => accountActive),
    getAccountByProtocolAndAddress: vi.fn(
      (protocol, address) => walletAccounts.find(
        (acc) => acc.protocol === protocol && acc.address === address,
      ),
    ),
    setActiveAccountByAddressAndProtocol,
  });

  // @ts-ignore
  (useAeSdk as vi.Mock).mockReturnValue({
    getAeSdk: vi.fn(async () => ({
      getBalance,
      api: {
        getAccountByPubkey,
        getAccountNextNonce,
      },
      txDryRun,
    })),
  });

  // @ts-ignore
  (useFungibleTokens as vi.Mock).mockReturnValue({
    loadSingleToken: vi.fn(),
    getProtocolAvailableTokens: vi.fn(() => ({})),
    getTxAssetSymbol: vi.fn(() => 'AE'),
  });

  // @ts-ignore
  (useModals as vi.Mock).mockReturnValue({ openModal });

  // @ts-ignore
  (useTransactionData as vi.Mock).mockReturnValue({
    amountTotal: computed(() => 1),
    direction: computed(() => 'sent'),
    innerTx: computed(() => undefined),
    isAex9: computed(() => false),
    isDex: computed(() => false),
    isAllowance: computed(() => false),
    isDexLiquidityAdd: computed(() => false),
    isDexLiquidityRemove: computed(() => false),
    isDexMaxSpent: computed(() => false),
    isDexMinReceived: computed(() => false),
    isDexPool: computed(() => false),
    isDexSwap: computed(() => false),
    isTokenSale: computed(() => false),
    isTokenSaleFactory: computed(() => false),
    txFunctionParsed: computed(() => undefined),
    transactionAssets: computed(() => []),
    outerTxTag: computed(() => undefined),
  });

  return mount(ConfirmTransactionSign, {
    global: {
      plugins: [i18n],
      stubs: {
        Modal: { template: '<div><slot /><slot name="footer" /></div>' },
        SignAccountSelect: SignAccountSelectStub,
        CheckBox: CheckBoxStub,
        TransactionOverview: true,
        TransactionDetailsPoolTokenRow: true,
        TransactionCallDataDetails: true,
        NoOriginWarning: true,
        DetailsItem: true,
        TokenAmount: true,
        BtnMain: true,
      },
    },
  });
}

const findSelect = (wrapper: any) => wrapper.findComponent(SignAccountSelectStub);
const findRebuild = (wrapper: any) => wrapper.find('[data-cy="rebuild-for-signer"]');
const canConfirm = (wrapper: any) => (wrapper.vm as any).canSignWithSelectedAccount;

describe('ConfirmTransactionSign.vue signing account', () => {
  beforeEach(() => vi.clearAllMocks());

  it('defaults to the account the transaction was built for, not the active one', async () => {
    const wrapper = mountModal();
    await flushPromises();

    expect(findSelect(wrapper).props('account')).toEqual(accountPrepared);
    expect(findSelect(wrapper).props('originalAddress')).toBe(ADDRESS_PREPARED);
    expect(findSelect(wrapper).props('signerAccountMissing')).toBe(false);
  });

  it('makes the prepared account active before resolving, so it signs the tx', async () => {
    const wrapper = mountModal();
    await flushPromises();

    await (wrapper.vm as any).confirm();

    expect(setActiveAccountByAddressAndProtocol).toHaveBeenCalledWith(
      ADDRESS_PREPARED,
      PROTOCOLS.aeternity,
    );
    expect(resolve).toHaveBeenCalled();
  });

  it('resolves with the chosen address, not just the active-account side effect', async () => {
    // The signer (which may run in a different browser context, e.g. behind a
    // real popup window) reads this payload rather than trusting that the
    // active-account change above has already propagated to it.
    const wrapper = mountModal();
    await flushPromises();

    await (wrapper.vm as any).confirm();

    expect(resolve).toHaveBeenCalledWith(expect.objectContaining({
      selectedAddress: ADDRESS_PREPARED,
      rebuildForSelectedAccount: false,
    }));
  });

  it('honours the user picking a different account in the switcher', async () => {
    const wrapper = mountModal();
    await flushPromises();

    await findSelect(wrapper).vm.$emit('select', accountActive);
    expect(findSelect(wrapper).props('account')).toEqual(accountActive);

    await (wrapper.vm as any).confirm();

    expect(setActiveAccountByAddressAndProtocol).toHaveBeenCalledWith(
      ADDRESS_ACTIVE,
      PROTOCOLS.aeternity,
    );
  });

  it('flags a transaction prepared for an account the wallet does not hold', async () => {
    const wrapper = mountModal(ADDRESS_FOREIGN);
    await flushPromises();

    expect(findSelect(wrapper).props('signerAccountMissing')).toBe(true);
    expect(findSelect(wrapper).props('originalAddress')).toBe(ADDRESS_FOREIGN);
    // Nothing better to fall back to than the active account.
    expect(findSelect(wrapper).props('account')).toEqual(accountActive);
  });

  it('does not switch accounts when the tx is already for the active account', async () => {
    const wrapper = mountModal(ADDRESS_ACTIVE);
    await flushPromises();

    expect(findSelect(wrapper).props('account')).toEqual(accountActive);

    await (wrapper.vm as any).confirm();

    expect(setActiveAccountByAddressAndProtocol).toHaveBeenCalledWith(
      ADDRESS_ACTIVE,
      PROTOCOLS.aeternity,
    );
  });
});

describe('ConfirmTransactionSign.vue rebuilding for another signer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('offers no rebuild while the prepared account is the one selected', async () => {
    const wrapper = mountModal();
    await flushPromises();

    expect(findRebuild(wrapper).exists()).toBe(false);
    expect(canConfirm(wrapper)).toBe(true);
  });

  it('offers the rebuild once another account is picked', async () => {
    const wrapper = mountModal();
    await flushPromises();

    await findSelect(wrapper).vm.$emit('select', accountActive);

    expect(findRebuild(wrapper).exists()).toBe(true);
  });

  it('blocks confirming until the user opts into the rebuild', async () => {
    const wrapper = mountModal();
    await flushPromises();

    await findSelect(wrapper).vm.$emit('select', accountActive);

    // Signing as-is would produce a signature the node rejects.
    expect(canConfirm(wrapper)).toBe(false);

    await findRebuild(wrapper).trigger('click');

    expect(canConfirm(wrapper)).toBe(true);
  });

  it('re-blocks confirming if the rebuild is unticked again', async () => {
    const wrapper = mountModal();
    await flushPromises();

    await findSelect(wrapper).vm.$emit('select', accountActive);
    await findRebuild(wrapper).trigger('click');
    expect(canConfirm(wrapper)).toBe(true);

    await findRebuild(wrapper).trigger('click');
    expect(canConfirm(wrapper)).toBe(false);
  });

  it('resolves with the rebuild opt-in, so the signer knows it was granted', async () => {
    const wrapper = mountModal();
    await flushPromises();

    await findSelect(wrapper).vm.$emit('select', accountActive);
    await findRebuild(wrapper).trigger('click');

    await (wrapper.vm as any).confirm();

    expect(resolve).toHaveBeenCalledWith(expect.objectContaining({
      selectedAddress: ADDRESS_ACTIVE,
      rebuildForSelectedAccount: true,
    }));
  });

  it('lets the user take over a tx prepared for an account the wallet does not hold', async () => {
    const wrapper = mountModal(ADDRESS_FOREIGN);
    await flushPromises();

    // A SpendTx is rebuildable, so the user can re-point it at their own account,
    // but only after explicitly opting in.
    expect(findRebuild(wrapper).exists()).toBe(true);
    expect(canConfirm(wrapper)).toBe(false);

    await findRebuild(wrapper).trigger('click');

    expect(canConfirm(wrapper)).toBe(true);
  });

  /**
   * The sender is part of the transaction, so the wallet can only honour a
   * different choice of signer where it can re-point the transaction at it.
   * Offering a switcher it cannot act on would strand the user on a Confirm
   * button that never enables.
   */
  it('offers no switcher for an EVM transaction, and leaves Confirm enabled', async () => {
    // EVM transactions are signed as-is by their `senderId`; nothing downstream
    // reads a choice made here.
    const wrapper = mountModal(ADDRESS_PREPARED, {
      protocol: PROTOCOLS.ethereum,
      txBase64: undefined,
      tx: { senderId: ADDRESS_EVM, fee: '21000', amount: '1000000000000000000' },
      fromAccount: ADDRESS_EVM,
    });
    await flushPromises();

    expect(findSelect(wrapper).exists()).toBe(false);
    expect(findRebuild(wrapper).exists()).toBe(false);
    expect(canConfirm(wrapper)).toBe(true);
  });

  it('offers no switcher for a transaction that cannot be re-pointed', async () => {
    const wrapper = mountModal(ADDRESS_PREPARED, {
      txBase64: 'tx_thisCannotBeUnpacked' as Encoded.Transaction,
    });
    await flushPromises();

    expect(findSelect(wrapper).exists()).toBe(false);
    expect(canConfirm(wrapper)).toBe(true);
  });

  it('hands the Air Gap device the rebuilt transaction, not the one the dapp prepared', async () => {
    // The Air Gap device signs exactly what this modal gives it - nothing
    // downstream rebuilds for it - so it has to receive the re-pointed
    // transaction or it would sign one sent by an account it cannot sign for.
    const wrapper = mountModal();
    await flushPromises();

    await findSelect(wrapper).vm.$emit('select', accountAirGap);
    await findRebuild(wrapper).trigger('click');

    await (wrapper.vm as any).confirm();

    const airGapCall = openModal.mock.calls
      .find(([name]) => name === MODAL_SIGN_AIR_GAP_TRANSACTION);
    expect(airGapCall).toBeDefined();

    const { txRaw } = airGapCall![1] as { txRaw: Encoded.Transaction };
    expect(txRaw).not.toBe((wrapper.vm as any).popupProps.txBase64);
    expect(getTransactionSignerAddress(txRaw)).toBe(ADDRESS_AIR_GAP);
    // The other half of the split: what gets signed takes the mempool-aware
    // next-nonce, never the chain nonce the dry run uses.
    expect((unpackTx(txRaw) as any).nonce).toBe(9);
  });
});

describe('ConfirmTransactionSign.vue contract-call verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(
      nodeState,
      {
        accountNonce: 7, nextNonce: 9, accountError: null, nextNonceError: null,
      },
    );
  });

  const DRY_RUN_OK = { callObj: { returnType: 'ok', gasPrice: 1000000000 } };

  const mountContractCall = () => mountModal(
    ADDRESS_PREPARED,
    { txBase64: buildContractCallTxFor(ADDRESS_PREPARED) },
    DRY_RUN_OK,
  );

  const lastDryRunTx = () => txDryRun.mock.calls.at(-1)![0] as Encoded.Transaction;
  const lastDryRunAddress = () => txDryRun.mock.calls.at(-1)![1] as Encoded.AccountAddress;
  const lastDryRunNonce = () => (unpackTx(lastDryRunTx()) as any).nonce;
  // The real footer gate is `!!error || verifying || loading || !canSign...`, so read
  // the button itself; the stub renders boolean props as attribute strings.
  const isAcceptDisabled = (wrapper: any) => (
    wrapper.find('[data-cy="accept"]').attributes('disabled') === 'true'
  );

  const optIntoRebuild = async (wrapper: any) => {
    await findSelect(wrapper).vm.$emit('select', accountActive);
    await findRebuild(wrapper).trigger('click');
    await flushPromises();
  };

  it('simulates the dapp transaction as its own caller before any rebuild', async () => {
    mountContractCall();
    await flushPromises();

    expect(txDryRun).toHaveBeenCalled();
    expect(getTransactionSignerAddress(lastDryRunTx())).toBe(ADDRESS_PREPARED);
    expect(lastDryRunAddress()).toBe(ADDRESS_PREPARED);
    expect(getAccountByPubkey).toHaveBeenLastCalledWith(ADDRESS_PREPARED);
  });

  it('simulates the re-pointed transaction once the user opts into a rebuild', async () => {
    const wrapper = mountContractCall();
    await flushPromises();

    await optIntoRebuild(wrapper);

    expect(getTransactionSignerAddress(lastDryRunTx())).toBe(ADDRESS_ACTIVE);
    expect(lastDryRunAddress()).toBe(ADDRESS_ACTIVE);
    expect(getAccountByPubkey).toHaveBeenLastCalledWith(ADDRESS_ACTIVE);
  });

  it('dry-runs with the chain nonce, not the mempool-aware next nonce', async () => {
    // Chain nonce 7 -> dry-run nonce 8; the next-nonce endpoint would say 9.
    const wrapper = mountContractCall();
    await flushPromises();

    expect(lastDryRunNonce()).toBe(8);
    expect((wrapper.vm as any).error).toBe('');
    expect(isAcceptDisabled(wrapper)).toBe(false);
  });

  it('still dry-runs for an account that has never sent a transaction', async () => {
    // No chain entry -> `getAccountByPubkey` 404s -> chain nonce 0 -> dry-run nonce 1.
    nodeState.accountError = accountNotFound;

    mountContractCall();
    await flushPromises();

    expect(txDryRun).toHaveBeenCalled();
    expect(lastDryRunNonce()).toBe(1);
  });

  it('surfaces an account lookup failure that is not a 404', async () => {
    nodeState.accountError = Object.assign(new Error('node unavailable'), { statusCode: 503 });

    const wrapper = mountContractCall();
    await flushPromises();

    expect(txDryRun).not.toHaveBeenCalled();
    expect((wrapper.vm as any).error).not.toBe('');
    expect(isAcceptDisabled(wrapper)).toBe(true);
  });

  it('still verifies the rebuild for an account that has never sent a transaction', async () => {
    // The rebuild fetches a next-nonce for the newly picked account, and the node
    // 404s for one with no chain history. Letting that escape skipped the dry run
    // entirely and left Confirm enabled, because the catch swallows a 404.
    const wrapper = mountContractCall();
    await flushPromises();
    const dryRunsBeforeRebuild = txDryRun.mock.calls.length;

    nodeState.nextNonceError = accountNotFound;

    await optIntoRebuild(wrapper);

    expect(txDryRun.mock.calls.length).toBeGreaterThan(dryRunsBeforeRebuild);
    expect(getTransactionSignerAddress(lastDryRunTx())).toBe(ADDRESS_ACTIVE);
    expect(isAcceptDisabled(wrapper)).toBe(false);
  });

  it('surfaces a next-nonce failure that is not a 404 instead of skipping the dry run', async () => {
    const wrapper = mountContractCall();
    await flushPromises();
    const dryRunsBeforeRebuild = txDryRun.mock.calls.length;

    nodeState.nextNonceError = Object.assign(new Error('node unavailable'), { statusCode: 503 });

    await optIntoRebuild(wrapper);

    expect(txDryRun.mock.calls.length).toBe(dryRunsBeforeRebuild);
    expect((wrapper.vm as any).error).not.toBe('');
    expect(isAcceptDisabled(wrapper)).toBe(true);
  });

  it('surfaces the revert and blocks Confirm when the rebuilt call would fail', async () => {
    const wrapper = mountContractCall();
    await flushPromises();
    expect(isAcceptDisabled(wrapper)).toBe(false);

    // Only the re-pointed call reverts - the dapp's original one still passes, so
    // this can only be caught by verifying the transaction that will be signed.
    txDryRun.mockImplementation(async (tx: Encoded.Transaction) => (
      (getTransactionSignerAddress(tx) === ADDRESS_ACTIVE)
        ? { callObj: { returnType: 'revert', returnValue: 'cb_KxFE1kQfP4oEp9E=' } }
        : DRY_RUN_OK
    ));

    await optIntoRebuild(wrapper);

    expect((wrapper.vm as any).error).not.toBe('');
    expect(isAcceptDisabled(wrapper)).toBe(true);
  });
});
