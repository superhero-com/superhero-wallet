// @ts-nocheck
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import en from '@/popup/locales/en-US.json';

import MultisigProposalDetails from '@/popup/pages/MultisigProposalDetails.vue';

/**
 * A co-signer approves a hash; the transaction behind it comes from the multisig backend.
 * The composables are mocked: `fetchActiveMultisigTx` says whether the two match.
 */
vi.mock('@/composables', () => ({
  useAccounts: vi.fn(),
  useAeSdk: vi.fn(),
  useFungibleTokens: vi.fn(),
  useModals: vi.fn(),
  useMultisigAccounts: vi.fn(),
  useMultisigTransactions: vi.fn(),
  usePendingMultisigTransaction: vi.fn(),
  useTransactionData: vi.fn(),
  useUi: vi.fn(),
}));
vi.mock('@ionic/vue', async (importOriginal) => ({
  ...(await importOriginal()),
  onIonViewWillLeave: vi.fn(),
}));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({ push: vi.fn() }),
}));
// Builds a signer for an account chosen other than the active one
vi.mock('@/protocols/aeternity/libs/AeAccountHdWallet', () => ({
  AeAccountHdWallet: class {
    sign = vi.fn();

    unsafeSign = vi.fn();

    signTransaction = vi.fn();
  },
}));

const composables = await import('@/composables');

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const TX_HASH = 'aa'.repeat(32);
const OTHER_TX_HASH = 'bb'.repeat(32);
const GA_ACCOUNT_ID = 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR';
const PROPOSER = 'ak_proposer';
const SIGNER = 'ak_signer';
const RAW_TX = 'tx_stored';
const GA_META_PARAMS = { fee: '200000000000000', gasPrice: '2000000000' };

const BtnMainStub = {
  props: ['disabled'],
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
};
const SlotStub = { template: '<div><slot /></div>' };
const TokenAmountStub = { props: ['amount'], template: '<span>{{ amount }}</span>' };

describe('MultisigProposalDetails', () => {
  let activeMultisigAccount;
  let fetchActiveMultisigTx;
  let sendTx;
  let callContractMethod;
  let updateMultisigAccounts;
  let openModal;
  let openDefaultModal;
  let isLocalAccountAddress;
  let pendingMultisigTxCanBeSent;

  beforeEach(() => {
    activeMultisigAccount = ref({
      contractId: 'ct_contract',
      gaAccountId: GA_ACCOUNT_ID,
      txHash: TX_HASH,
      nonce: 3,
      confirmedBy: [],
      signers: [],
      expirationHeight: 2000,
      hasPendingTransaction: true,
      proposedBy: PROPOSER,
    });
    fetchActiveMultisigTx = vi.fn();
    // What the SDK resolves once the GaMetaTx is mined
    sendTx = vi.fn().mockResolvedValue({
      hash: 'th_sent',
      tx: { fee: '20000000000000', tx: { tx: { amount: '100', fee: '16840000000000' } } },
    });
    callContractMethod = vi.fn();
    updateMultisigAccounts = vi.fn();
    openModal = vi.fn().mockResolvedValue(SIGNER);
    openDefaultModal = vi.fn();
    isLocalAccountAddress = () => false;
    pendingMultisigTxCanBeSent = ref(false);

    composables.useAccounts.mockImplementation(() => ({
      activeAccount: ref({ address: SIGNER }),
      isLocalAccountAddress,
    }));
    composables.useAeSdk.mockReturnValue({ nodeNetworkId: ref('ae_uat') });
    composables.useFungibleTokens.mockReturnValue({ getTxAssetSymbol: vi.fn() });
    composables.useModals.mockReturnValue({ openDefaultModal, openModal });
    composables.useMultisigAccounts.mockReturnValue({
      activeMultisigAccount,
      activeMultisigAccountExplorerUrl: ref('https://explorer'),
      updateMultisigAccounts,
      fetchAdditionalInfo: vi.fn(),
      stopFetchingAdditionalInfo: vi.fn(),
    });
    composables.useMultisigTransactions.mockReturnValue({
      fetchActiveMultisigTx,
      fetchTransactionByHash: vi.fn().mockResolvedValue({ hash: TX_HASH, tx: RAW_TX }),
      sendTx,
      callContractMethod,
    });
    composables.usePendingMultisigTransaction.mockReturnValue({
      pendingMultisigTxExpired: ref(false),
      pendingMultisigTxExpiresAt: ref(100),
      pendingMultisigTxCanBeSent,
      pendingMultisigTxLocalSigners: ref([]),
      pendingMultisigTxConfirmedByLocalSigners: ref(false),
    });
    composables.useTransactionData.mockReturnValue({ transactionAssets: ref([]) });
    composables.useUi.mockReturnValue({
      isLoaderVisible: ref(false),
      setLoaderVisible: vi.fn(),
    });
  });

  /** As `fetchActiveMultisigTx` resolves the proposal the vault has now */
  function loaded({ isTxVerified }) {
    return {
      ...activeMultisigAccount.value,
      hash: activeMultisigAccount.value.txHash,
      tx: isTxVerified
        ? { recipientId: GA_ACCOUNT_ID, amount: '100', fee: '16840000000000' }
        : undefined,
      isTxVerified,
      gaMetaParams: isTxVerified ? GA_META_PARAMS : undefined,
    };
  }

  async function mountPage() {
    const wrapper = mount(MultisigProposalDetails, {
      global: {
        plugins: [i18n],
        stubs: {
          PageWrapper: SlotStub,
          FixedScreenFooter: SlotStub,
          BtnMain: BtnMainStub,
          TransactionAssetRows: true,
          TransactionInfo: true,
          LinkButton: true,
          AccountItem: true,
          DialogBox: true,
          MultisigProposalConsensus: true,
          PayloadDetails: true,
          CopyText: true,
          Avatar: true,
          TokenAmount: TokenAmountStub,
        },
      },
    });
    await flushPromises();
    return wrapper;
  }

  async function mountWith({ isTxVerified }) {
    fetchActiveMultisigTx.mockImplementation(async () => loaded({ isTxVerified }));
    return mountPage();
  }

  const button = (wrapper, text) => wrapper.findAll('button').find((item) => item.text() === text);
  const warning = (wrapper) => wrapper.find('[data-cy=unverified-warning]');
  /** As the next poll of the vault, with nothing changed */
  async function pollVault() {
    activeMultisigAccount.value = { ...activeMultisigAccount.value };
    await flushPromises();
  }

  it('warns about a transaction that does not match the proposal and blocks approving it', async () => {
    const wrapper = await mountWith({ isTxVerified: false });

    expect(warning(wrapper).text()).toContain(en.pages.proposalDetails.unverified.msg);
    expect(wrapper.find('[data-cy=sign]').attributes('disabled')).toBeDefined();
    expect(button(wrapper, en.pages.proposalDetails.refuse).attributes('disabled')).toBeUndefined();
    expect(wrapper.find('[data-cy=proposal-fee]').exists()).toBe(false);
  });

  it('blocks sending a confirmed proposal whose transaction does not match it', async () => {
    pendingMultisigTxCanBeSent.value = true;
    const wrapper = await mountWith({ isTxVerified: false });

    expect(wrapper.find('[data-cy=send]').attributes('disabled')).toBeDefined();
    await wrapper.vm.processProposal();

    expect(sendTx).not.toHaveBeenCalled();
  });

  it('lets a matching proposal be approved, showing the fee it was hashed with', async () => {
    const wrapper = await mountWith({ isTxVerified: true });

    expect(warning(wrapper).exists()).toBe(false);
    expect(wrapper.find('[data-cy=sign]').attributes('disabled')).toBeUndefined();
    expect(wrapper.find('[data-cy=proposal-fee]').text()).toContain('0.0002');
  });

  it('sends a matching proposal with its hash', async () => {
    pendingMultisigTxCanBeSent.value = true;
    const wrapper = await mountWith({ isTxVerified: true });

    await wrapper.find('[data-cy=send]').trigger('click');
    await flushPromises();

    expect(sendTx).toHaveBeenCalledWith(GA_ACCOUNT_ID, RAW_TX, 3, TX_HASH);
  });

  it('does not warn about a proposal it sent', async () => {
    pendingMultisigTxCanBeSent.value = true;
    updateMultisigAccounts.mockImplementation(async () => {
      activeMultisigAccount.value = { ...activeMultisigAccount.value, txHash: undefined };
    });
    const wrapper = await mountWith({ isTxVerified: true });

    await wrapper.find('[data-cy=send]').trigger('click');
    await flushPromises();

    expect(warning(wrapper).exists()).toBe(false);
    expect(wrapper.find('[data-cy=send]').exists()).toBe(false);
  });

  it('approves the proposal it was shown, with its hash', async () => {
    const wrapper = await mountWith({ isTxVerified: true });

    await wrapper.find('[data-cy=sign]').trigger('click');
    await flushPromises();

    expect(callContractMethod).toHaveBeenCalledWith('confirm', 'ct_contract', TX_HASH, {});
  });

  it.each([
    ['approve', 'confirm', (wrapper) => wrapper.find('[data-cy=sign]')],
    ['disapprove', 'refuse', (wrapper) => button(wrapper, en.pages.proposalDetails.refuse)],
  ])('does not %s a proposal the vault moved on from while the modal was open', async (_, action, find) => {
    const wrapper = await mountWith({ isTxVerified: true });
    openModal.mockImplementation(async () => {
      activeMultisigAccount.value = { ...activeMultisigAccount.value, txHash: OTHER_TX_HASH };
      return SIGNER;
    });

    await find(wrapper).trigger('click');
    await flushPromises();

    expect(openModal).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ action }));
    expect(callContractMethod).not.toHaveBeenCalled();
    expect(openDefaultModal).toHaveBeenCalledWith(expect.objectContaining({
      msg: en.pages.proposalDetails.changed,
    }));
  });

  it('lets the proposer revoke a proposal whose transaction does not match it', async () => {
    isLocalAccountAddress = (address) => address === PROPOSER;
    const wrapper = await mountWith({ isTxVerified: false });
    const revoke = button(wrapper, en.pages.proposalDetails.revokeTransaction);

    expect(revoke.attributes('disabled')).toBeUndefined();
    await revoke.trigger('click');
    await flushPromises();

    expect(callContractMethod).toHaveBeenCalledWith('revoke', 'ct_contract', TX_HASH, {});
  });

  it('shows the proposal the vault has now when an earlier one finishes loading last', async () => {
    let resolveFirst;
    fetchActiveMultisigTx.mockImplementationOnce(() => new Promise((resolve) => {
      resolveFirst = resolve;
    }));
    const wrapper = await mountPage();
    const first = loaded({ isTxVerified: true });

    activeMultisigAccount.value = { ...activeMultisigAccount.value, txHash: OTHER_TX_HASH };
    fetchActiveMultisigTx.mockImplementation(async () => loaded({ isTxVerified: false }));
    await flushPromises();
    resolveFirst(first);
    await flushPromises();

    expect(warning(wrapper).exists()).toBe(true);
    expect(wrapper.find('[data-cy=sign]').attributes('disabled')).toBeDefined();
    // Nothing of the earlier proposal's transaction
    expect(wrapper.find('[data-cy=proposal-fee]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain(en.pages.proposalDetails.receivingAddress);
  });

  it('checks an unverified proposal again with the next poll of the vault', async () => {
    const wrapper = await mountWith({ isTxVerified: false });

    fetchActiveMultisigTx.mockImplementation(async () => loaded({ isTxVerified: true }));
    await pollVault();

    expect(warning(wrapper).exists()).toBe(false);
    expect(wrapper.find('[data-cy=sign]').attributes('disabled')).toBeUndefined();

    const loads = fetchActiveMultisigTx.mock.calls.length;
    await pollVault();
    expect(fetchActiveMultisigTx).toHaveBeenCalledTimes(loads);
  });

  it('keeps a match when loading the proposal again fails', async () => {
    const wrapper = await mountWith({ isTxVerified: true });

    fetchActiveMultisigTx.mockImplementation(async () => loaded({ isTxVerified: false }));
    activeMultisigAccount.value = { ...activeMultisigAccount.value, confirmedBy: [SIGNER] };
    await flushPromises();

    expect(fetchActiveMultisigTx).toHaveBeenCalledTimes(2);
    expect(warning(wrapper).exists()).toBe(false);
    expect(wrapper.find('[data-cy=proposal-fee]').exists()).toBe(true);
  });
});
