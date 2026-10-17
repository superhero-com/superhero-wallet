/**
 * [BLACK-BOX] A transfer the user just sent stays pending in the latest transactions until
 * a transaction of the same account with the same nonce is mined on the same chain.
 * Faked: the wallet's accounts and the network (sending, Etherscan, the æternity middleware).
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { ref, type Ref } from 'vue';
import { routerKey } from 'vue-router';
import { toChecksumAddress } from 'web3-utils';
import type { AccountAddress, ICommonTransaction, ITransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import { STUB_ACCOUNT, recipientId as AE_OTHER_ADDRESS } from '@/constants/stubs';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';

/** The Ethereum and BNB accounts of one wallet index derive the same address. */
const EVM_ADDRESS = STUB_ACCOUNT.addressEthereum as AccountAddress;
const EVM_OTHER_ADDRESS = toChecksumAddress('0x5a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c') as AccountAddress;
const AE_ADDRESS = STUB_ACCOUNT.addressAeternity;

const ETHEREUM_CHAIN_ID = '1';
const BNB_CHAIN_ID = '56';

const ACCOUNTS = [
  { protocol: PROTOCOLS.ethereum, address: EVM_ADDRESS },
  { protocol: PROTOCOLS.bnb, address: EVM_ADDRESS },
  { protocol: PROTOCOLS.aeternity, address: AE_ADDRESS },
];

const SENT_HASH = `0x${'a1'.repeat(32)}`;
const SECOND_SENT_HASH = `0x${'a2'.repeat(32)}`;
const OTHER_HASH = `0x${'b2'.repeat(32)}`;
const AE_SENT_HASH = 'th_2CKnN6EorvNiwwqRjSzXLrPLiHmcwo4Ny22dwCrSYRoD6MVGK1';
const AE_OTHER_HASH = 'th_HZMNgTvEiyKeATpauJjjeWwZcyHapKG8bDgy2S1sCUEUQnbwK';

/** Etherscan `txlist` rows by chain id */
let etherscanTxList: Record<string, object[]>;
/** The æternity middleware history, as normalized by the adapter */
let aeHistory: ITransaction[];

let useLatestTransactionList: typeof import('@/composables/latestTransactionList')['useLatestTransactionList'];
let ProtocolAdapterFactory: typeof import('@/lib/ProtocolAdapterFactory')['ProtocolAdapterFactory'];

function etherscanTransfer({
  hash, nonce, from, to, confirmations = '30',
}: {
  hash: string;
  nonce: number;
  from: string;
  to: string;
  confirmations?: string;
}) {
  return {
    blockNumber: '21000000',
    timeStamp: '1760000000',
    hash,
    nonce: String(nonce),
    blockHash: `0x${'c3'.repeat(32)}`,
    transactionIndex: '7',
    from: from.toLowerCase(),
    to: to.toLowerCase(),
    value: '100000000000000000',
    gas: '21000',
    gasPrice: '1000000000',
    isError: '0',
    txreceipt_status: '1',
    input: '0x',
    contractAddress: '',
    cumulativeGasUsed: '21000',
    gasUsed: '21000',
    confirmations,
    methodId: '0x',
    functionName: '',
  };
}

function aeMiddlewareSpend({
  hash, nonce, senderId, recipientId,
}: {
  hash: string;
  nonce: number;
  senderId: AccountAddress;
  recipientId: AccountAddress;
}) {
  return {
    blockHash: 'mh_2Rk3wiaYXL7mUTBNfFJTtpJhqqMqLCjkEDT6v4f9kWNDyYVaJJ',
    blockHeight: 1100000,
    hash,
    microIndex: 3,
    microTime: 1760000000000,
    signatures: ['sg_Bq8fMh6bvWuc1DMdMQjm3A9sD5TCXuhNGs4J8tiuo2ABBfFx2jKmoJjUWE1gkVfQpGswJvz9ehF6b6hH8vEzHFE8zU9HF'],
    tx: {
      amount: 1e18,
      fee: 16840000000000,
      nonce,
      payload: 'ba_Xfbg4g==',
      recipientId,
      senderId,
      ttl: 0,
      type: 'SpendTx',
      version: 1,
    },
    transactionOwner: AE_ADDRESS,
    protocol: PROTOCOLS.aeternity,
  } as unknown as ITransaction;
}

function findTransaction(transactions: Ref<ICommonTransaction[]>, hash: string) {
  return transactions.value.find((transaction) => transaction.hash === hash);
}

/** Opens the wallet and waits for the transactions it loads on start. */
async function openWallet() {
  const latestTransactionList = useLatestTransactionList();
  await flushPromises();
  return latestTransactionList;
}

/** Sends 0.1 ETH to another account from the review screen, once per hash. */
async function sendEther({ hashes, nonce }: { hashes: string[]; nonce: number }) {
  const protocol = PROTOCOLS.ethereum;
  const adapter = ProtocolAdapterFactory.getAdapter(protocol);
  vi.spyOn(adapter as any, 'getTransactionCount').mockResolvedValue(nonce);
  const spend = vi.spyOn(adapter, 'spend');
  hashes.forEach((hash) => spend.mockResolvedValueOnce({ hash }));
  // Not mined while the app is open
  vi.spyOn(adapter, 'waitTransactionMined').mockReturnValue(new Promise(() => {}));

  const { default: EthTransferReview } = await import('@/protocols/ethereum/components/TransferReview.vue');
  const { i18n } = await import('@/popup/plugins/i18n');
  const wrapper = mount(EthTransferReview, {
    props: {
      protocol,
      transferData: {
        amount: '0.1',
        addresses: hashes.map(() => EVM_OTHER_ADDRESS),
        selectedAsset: { contractId: adapter.coinContractId, protocol } as any,
        payload: '',
      },
    },
    global: {
      plugins: [i18n],
      provide: { [routerKey as symbol]: { push: vi.fn() } },
      stubs: { TransferReviewBase: true },
    },
  });
  await (wrapper.vm as any).submit();
  return spend;
}

/** Sends 1 AE with a nonce set in the advanced settings, as the æternity review screen does. */
function sendAe(
  addAccountPendingTransaction: (address: AccountAddress, transaction: ITransaction) => void,
  { hash, nonce }: { hash: string; nonce: number },
) {
  const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.aeternity);
  vi.spyOn(adapter, 'waitTransactionMined').mockReturnValue(new Promise(() => {}));
  addAccountPendingTransaction(AE_ADDRESS, {
    hash,
    pending: true,
    transactionOwner: AE_ADDRESS,
    protocol: PROTOCOLS.aeternity,
    tx: {
      amount: 1e18,
      callerId: AE_ADDRESS,
      contractId: AE_CONTRACT_ID,
      senderId: AE_ADDRESS,
      type: 'SpendTx',
      function: 'transfer',
      recipientId: AE_OTHER_ADDRESS,
      arguments: [],
      fee: 16840000000000,
      nonce,
    },
  } as ITransaction);
}

enableAutoUnmount(afterEach);

describe('useLatestTransactionList', () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    etherscanTxList = {};
    aeHistory = [];

    // Must be registered before `registerAdapters` loads the real composables.
    vi.doMock('@/composables/accounts', () => ({
      useAccounts: () => ({
        accounts: ref(ACCOUNTS),
        getAccountByProtocolAndAddress: (protocol: string, address: string) => ACCOUNTS
          .find((account) => account.protocol === protocol && account.address === address),
        getLastActiveProtocolAccount: (protocol: string) => ACCOUNTS
          .find((account) => account.protocol === protocol),
      }),
    }));
    vi.doMock('@/composables/balances', () => ({
      useBalances: () => ({ balances: ref({}) }),
    }));
    vi.doMock('@/composables/fungibleTokens', () => ({
      useFungibleTokens: () => ({ tokenBalances: ref([]) }),
    }));

    await import('@/protocols/registerAdapters');
    ({ ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory'));
    ({ useLatestTransactionList } = await import('@/composables/latestTransactionList'));

    const { EtherscanService } = await import('@/protocols/ethereum/libs/EtherscanService');
    vi.spyOn(EtherscanService.prototype, 'fetchFromApi').mockImplementation(
      async function fetchFromApi(this: InstanceType<typeof EtherscanService>, { action }) {
        const result = (action === 'txlist' && etherscanTxList[this.chainId]) || [];
        return (result.length)
          ? { status: '1', message: 'OK', result }
          : { status: '0', message: 'No transactions found', result: [] };
      },
    );
    vi.spyOn(ProtocolAdapterFactory.getAdapter(PROTOCOLS.aeternity), 'fetchAccountTransactions')
      .mockImplementation(async () => ({
        regularTransactions: aeHistory,
        pendingTransactions: [],
        paginationParams: {},
      }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('a pending Ethereum transfer', () => {
    it('stays when an incoming transfer has the same nonce', async () => {
      const { allLatestTransactions, loadAllLatestTransactions } = await openWallet();
      await sendEther({ hashes: [SENT_HASH], nonce: 5 });

      // The 5th transaction of another account pays to this one
      etherscanTxList[ETHEREUM_CHAIN_ID] = [etherscanTransfer({
        hash: OTHER_HASH, nonce: 5, from: EVM_OTHER_ADDRESS, to: EVM_ADDRESS,
      })];
      await loadAllLatestTransactions();

      expect(findTransaction(allLatestTransactions, SENT_HASH)).toMatchObject({ pending: true });
      expect(findTransaction(allLatestTransactions, OTHER_HASH)).toMatchObject({ pending: false });
    });

    it('stays when the BNB account of the same address mines its own transaction with that nonce', async () => {
      const { allLatestTransactions, loadAllLatestTransactions } = await openWallet();
      await sendEther({ hashes: [SENT_HASH], nonce: 5 });

      etherscanTxList[BNB_CHAIN_ID] = [etherscanTransfer({
        hash: OTHER_HASH, nonce: 5, from: EVM_ADDRESS, to: EVM_OTHER_ADDRESS,
      })];
      await loadAllLatestTransactions();

      expect(findTransaction(allLatestTransactions, SENT_HASH))
        .toMatchObject({ pending: true, protocol: PROTOCOLS.ethereum });
      expect(findTransaction(allLatestTransactions, OTHER_HASH))
        .toMatchObject({ pending: false, protocol: PROTOCOLS.bnb });
    });

    it('is replaced when the account mines another transaction with that nonce', async () => {
      const { allLatestTransactions, loadAllLatestTransactions } = await openWallet();
      await sendEther({ hashes: [SENT_HASH], nonce: 5 });

      // Sped up or cancelled: same sender and nonce, different hash
      etherscanTxList[ETHEREUM_CHAIN_ID] = [etherscanTransfer({
        hash: OTHER_HASH, nonce: 5, from: EVM_ADDRESS, to: EVM_OTHER_ADDRESS,
      })];
      await loadAllLatestTransactions();

      expect(findTransaction(allLatestTransactions, SENT_HASH)).toBeUndefined();
      expect(findTransaction(allLatestTransactions, OTHER_HASH)).toMatchObject({ pending: false });
    });

    it('leaves only the mined transaction once it is mined', async () => {
      const {
        accountsTransactionsPending,
        allLatestTransactions,
        loadAllLatestTransactions,
      } = await openWallet();
      await sendEther({ hashes: [SENT_HASH], nonce: 5 });

      etherscanTxList[ETHEREUM_CHAIN_ID] = [etherscanTransfer({
        hash: SENT_HASH, nonce: 5, from: EVM_ADDRESS, to: EVM_OTHER_ADDRESS,
      })];
      await loadAllLatestTransactions();

      expect(accountsTransactionsPending.value[EVM_ADDRESS]).toEqual([]);
      expect(allLatestTransactions.value.filter(({ hash }) => hash === SENT_HASH))
        .toEqual([expect.objectContaining({ pending: false })]);
    });

    it('with nonce 0 is replaced when the account mines another transaction with nonce 0', async () => {
      const { allLatestTransactions, loadAllLatestTransactions } = await openWallet();
      await sendEther({ hashes: [SENT_HASH], nonce: 0 });

      etherscanTxList[ETHEREUM_CHAIN_ID] = [etherscanTransfer({
        hash: OTHER_HASH, nonce: 0, from: EVM_ADDRESS, to: EVM_OTHER_ADDRESS,
      })];
      await loadAllLatestTransactions();

      expect(findTransaction(allLatestTransactions, SENT_HASH)).toBeUndefined();
      expect(findTransaction(allLatestTransactions, OTHER_HASH)).toMatchObject({ pending: false });
    });

    it('sent to several recipients is replaced only for the recipient whose transfer was sped up', async () => {
      const { allLatestTransactions, loadAllLatestTransactions } = await openWallet();
      const spend = await sendEther({ hashes: [SENT_HASH, SECOND_SENT_HASH], nonce: 5 });
      expect(spend.mock.calls.map(([, , { nonce }]) => nonce)).toEqual([5, 6]);

      etherscanTxList[ETHEREUM_CHAIN_ID] = [etherscanTransfer({
        hash: OTHER_HASH, nonce: 5, from: EVM_ADDRESS, to: EVM_OTHER_ADDRESS,
      })];
      await loadAllLatestTransactions();

      expect(findTransaction(allLatestTransactions, SENT_HASH)).toBeUndefined();
      expect(findTransaction(allLatestTransactions, SECOND_SENT_HASH))
        .toMatchObject({ pending: true });
    });
  });

  describe('a pending æternity transfer', () => {
    it('stays when an incoming transfer has the same nonce', async () => {
      const {
        addAccountPendingTransaction,
        allLatestTransactions,
        loadAllLatestTransactions,
      } = await openWallet();
      sendAe(addAccountPendingTransaction, { hash: AE_SENT_HASH, nonce: 5 });

      aeHistory = [aeMiddlewareSpend({
        hash: AE_OTHER_HASH, nonce: 5, senderId: AE_OTHER_ADDRESS, recipientId: AE_ADDRESS,
      })];
      await loadAllLatestTransactions();

      expect(findTransaction(allLatestTransactions, AE_SENT_HASH)).toMatchObject({ pending: true });
      expect(findTransaction(allLatestTransactions, AE_OTHER_HASH)).toBeDefined();
    });

    it('is replaced when the account mines another transaction with that nonce', async () => {
      const {
        addAccountPendingTransaction,
        allLatestTransactions,
        loadAllLatestTransactions,
      } = await openWallet();
      sendAe(addAccountPendingTransaction, { hash: AE_SENT_HASH, nonce: 5 });

      // Sent again with the same nonce and a higher fee
      aeHistory = [aeMiddlewareSpend({
        hash: AE_OTHER_HASH, nonce: 5, senderId: AE_ADDRESS, recipientId: AE_OTHER_ADDRESS,
      })];
      await loadAllLatestTransactions();

      expect(findTransaction(allLatestTransactions, AE_SENT_HASH)).toBeUndefined();
      expect(findTransaction(allLatestTransactions, AE_OTHER_HASH)).toBeDefined();
    });
  });

  describe('Ethereum and BNB accounts sharing an address', () => {
    it('shows the latest transactions of both', async () => {
      etherscanTxList[ETHEREUM_CHAIN_ID] = [etherscanTransfer({
        hash: SENT_HASH, nonce: 5, from: EVM_ADDRESS, to: EVM_OTHER_ADDRESS,
      })];
      etherscanTxList[BNB_CHAIN_ID] = [etherscanTransfer({
        hash: OTHER_HASH, nonce: 7, from: EVM_ADDRESS, to: EVM_OTHER_ADDRESS,
      })];
      const { allLatestTransactions } = await openWallet();

      expect(findTransaction(allLatestTransactions, SENT_HASH))
        .toMatchObject({ protocol: PROTOCOLS.ethereum });
      expect(findTransaction(allLatestTransactions, OTHER_HASH))
        .toMatchObject({ protocol: PROTOCOLS.bnb });
    });

    it('keeps refreshing the transactions of both that wait for confirmations', async () => {
      const transfers = (confirmations?: string) => ({
        [ETHEREUM_CHAIN_ID]: [etherscanTransfer({
          hash: SENT_HASH, nonce: 5, from: EVM_ADDRESS, to: EVM_OTHER_ADDRESS, confirmations,
        })],
        [BNB_CHAIN_ID]: [etherscanTransfer({
          hash: OTHER_HASH, nonce: 7, from: EVM_ADDRESS, to: EVM_OTHER_ADDRESS, confirmations,
        })],
      });
      etherscanTxList = transfers('3');
      const { allLatestTransactions } = await openWallet();
      expect(findTransaction(allLatestTransactions, SENT_HASH)).toMatchObject({ pending: true });
      expect(findTransaction(allLatestTransactions, OTHER_HASH)).toMatchObject({ pending: true });

      etherscanTxList = transfers();
      vi.advanceTimersByTime(60000);
      await flushPromises();

      expect(findTransaction(allLatestTransactions, SENT_HASH)).toMatchObject({ pending: false });
      expect(findTransaction(allLatestTransactions, OTHER_HASH)).toMatchObject({ pending: false });
    });
  });
});
