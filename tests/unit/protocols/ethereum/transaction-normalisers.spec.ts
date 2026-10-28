// @ts-nocheck
import { enableAutoUnmount, mount } from '@vue/test-utils';
import Web3Eth from 'web3-eth';
import { i18n, tg } from '@/popup/plugins/i18n';
import { PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useCurrencies } from '@/composables';
import { EtherscanService } from '@/protocols/ethereum/libs/EtherscanService';
import { normalizeWeb3EthTransactionStructure } from '@/protocols/ethereum/helpers';
import TransactionListItem from '@/popup/components/TransactionListItem.vue';

const OWNER = '0x1111111111111111111111111111111111111111';
const OTHER = '0x2222222222222222222222222222222222222222';
const CONTRACT = '0x5555555555555555555555555555555555555555';
const HASH = '0xc0ffee0000000000000000000000000000000000000000000000000000000001';

enableAutoUnmount(afterEach);

/** Etherscan `txlist` row, in the documented response shape */
const txlistRow = (overrides = {}) => ({
  blockNumber: '19000000',
  timeStamp: '1700000000',
  hash: HASH,
  nonce: '7',
  blockHash: '0xb10c000000000000000000000000000000000000000000000000000000000001',
  transactionIndex: '12',
  from: OWNER,
  to: OTHER,
  value: '500000000000000000',
  gas: '21000',
  gasPrice: '20000000000',
  isError: '0',
  txreceipt_status: '1',
  input: '0x',
  contractAddress: '',
  cumulativeGasUsed: '1000000',
  gasUsed: '21000',
  confirmations: '100',
  methodId: '0x',
  functionName: '',
  ...overrides,
});

/** Etherscan `tokentx` row: no `isError` / `txreceipt_status` fields */
const tokentxRow = () => ({
  blockNumber: '19000000',
  timeStamp: '1700000000',
  hash: HASH,
  nonce: '7',
  from: OWNER,
  contractAddress: CONTRACT,
  to: OTHER,
  value: '1000000',
  tokenName: 'Token',
  tokenSymbol: 'TKN',
  tokenDecimal: '6',
  gas: '60000',
  gasPrice: '20000000000',
  gasUsed: '50000',
  input: 'deprecated',
  confirmations: '100',
});

const revertedCall = txlistRow({
  to: CONTRACT,
  value: '0',
  input: '0xa9059cbb',
  isError: '1',
  txreceipt_status: '0',
  gasUsed: '30000',
  functionName: 'transfer(address _to, uint256 _value)',
});

const normalize = (row) => EtherscanService
  .normalizeEtherscanTransactionStructure(PROTOCOLS.ethereum, row, OWNER);

describe('Etherscan transactions', () => {
  it.each([
    ['a successful transfer', undefined, txlistRow()],
    ['a reverted contract call', 'revert', revertedCall],
    ['a failed pre-Byzantium call', 'revert', txlistRow({ isError: '1', txreceipt_status: '' })],
    ['a token transfer', undefined, tokentxRow()],
  ])('%s has returnType %s', (_, returnType, row) => {
    expect(normalize(row).tx.returnType).toBe(returnType);
  });

  it.each([
    ['a successful transfer', true, txlistRow({ confirmations: '3' })],
    ['a reverted contract call', false, { ...revertedCall, confirmations: '3' }],
  ])('%s under 12 confirmations is pending: %s', (_, isPending, row) => {
    expect(normalize(row).pending).toBe(isPending);
  });

  describe('in the transaction list', () => {
    const { currencyRates } = useCurrencies({ pollingDisabled: true });

    beforeEach(() => {
      currencyRates.value = { ethereum: { usd: 2000 } };
    });

    const mountItem = (transaction) => mount(TransactionListItem, {
      props: { transaction },
      global: {
        plugins: [i18n],
        stubs: { ListItemWrapper: { template: '<div><slot /></div>' }, TransactionAssetRows: true },
      },
    });

    it('labels a reverted transaction and shows no fiat amount', () => {
      const wrapper = mountItem(normalize(revertedCall));

      expect(wrapper.text()).toContain(tg('transaction.returnType.revert'));
      expect(wrapper.text()).not.toContain('USD');
    });

    it('labels a reverted transfer under 12 confirmations as reverted, not as sending', () => {
      const wrapper = mountItem(normalize(txlistRow({ isError: '1', txreceipt_status: '0', confirmations: '3' })));

      expect(wrapper.text()).toContain(tg('transaction.returnType.revert'));
      expect(wrapper.text()).not.toContain(`${tg('transaction.type.sentTx')}...`);
    });

    it('shows the fiat amount of a successful transaction', () => {
      const wrapper = mountItem(normalize(txlistRow()));

      expect(wrapper.text()).not.toContain(tg('transaction.returnType.revert'));
      expect(wrapper.text()).toContain('USD');
    });
  });
});

/** web3 `getTransaction` result (DEFAULT_RETURN_FORMAT) */
const web3Transaction = (overrides = {}) => ({
  blockHash: '0xb10c000000000000000000000000000000000000000000000000000000000001',
  blockNumber: 19000000n,
  from: OWNER,
  to: OTHER,
  gas: 30000n,
  gasPrice: 20000000000n,
  hash: HASH,
  input: '0x',
  type: 0n,
  value: 500000000000000000n,
  ...overrides,
});

describe('normalizeWeb3EthTransactionStructure', () => {
  it('treats a plain transfer as a coin spend', () => {
    const { protocol, tx } = normalizeWeb3EthTransactionStructure(
      PROTOCOLS.ethereum,
      web3Transaction(),
      undefined,
      OWNER,
    );

    expect(protocol).toBe(PROTOCOLS.ethereum);
    expect(tx.type).toBe('SpendTx');
    expect(tx.tag).toBe('SpendTx');
    expect(tx.contractId).toBe(
      ProtocolAdapterFactory.getAdapter(PROTOCOLS.ethereum).coinContractId,
    );
  });

  it('treats a call with input as a contract call on the called contract', () => {
    const { tx } = normalizeWeb3EthTransactionStructure(
      PROTOCOLS.ethereum,
      web3Transaction({ to: CONTRACT, input: '0xa9059cbb' }),
      undefined,
      OWNER,
    );

    expect(tx.type).toBe('ContractCallTx');
    expect(tx.tag).toBe('ContractCallTx');
    expect(tx.contractId).toBe(CONTRACT);
  });

  it('keeps the protocol it is given', () => {
    const { protocol, tx } = normalizeWeb3EthTransactionStructure(
      PROTOCOLS.bnb,
      web3Transaction(),
      undefined,
      OWNER,
    );

    expect(protocol).toBe(PROTOCOLS.bnb);
    expect(tx.contractId).toBe(ProtocolAdapterFactory.getAdapter(PROTOCOLS.bnb).coinContractId);
  });

  it('takes the fee of a mined transaction from its receipt', () => {
    const { tx } = normalizeWeb3EthTransactionStructure(
      PROTOCOLS.ethereum,
      web3Transaction({ type: 2n }),
      undefined,
      OWNER,
      { status: 1n, gasUsed: 21000n, effectiveGasPrice: 10000000000n },
    );

    // 21000 × 10 gwei
    expect(tx.fee).toBe(0.00021);
    expect(tx.returnType).toBeUndefined();
  });

  it('falls back to the gas price when the receipt has no effective gas price', () => {
    const { tx } = normalizeWeb3EthTransactionStructure(
      PROTOCOLS.bnb,
      web3Transaction({ type: 0n }),
      undefined,
      OWNER,
      { status: 1n, gasUsed: 21000n },
    );

    // 21000 × 20 gwei, the receipt has no effectiveGasPrice
    expect(tx.fee).toBe(0.00042);
  });

  it('shows the gas limit fee of a pending transaction and no revert', () => {
    const { tx } = normalizeWeb3EthTransactionStructure(
      PROTOCOLS.ethereum,
      web3Transaction({ blockHash: null, blockNumber: null }),
      undefined,
      OWNER,
    );

    // 30000 × 20 gwei
    expect(tx.fee).toBe(0.0006);
    expect(tx.returnType).toBeUndefined();
  });

  it('marks a transaction with a failed receipt as reverted', () => {
    const { tx } = normalizeWeb3EthTransactionStructure(
      PROTOCOLS.ethereum,
      web3Transaction({ to: CONTRACT, input: '0xa9059cbb' }),
      undefined,
      OWNER,
      { status: 0n, gasUsed: 25000n, effectiveGasPrice: 20000000000n },
    );

    expect(tx.returnType).toBe('revert');
  });
});

describe.each([
  PROTOCOLS.ethereum,
  PROTOCOLS.bnb,
  PROTOCOLS.avalanche,
  PROTOCOLS.polygonPos,
])('fetchTransactionByHash on %s', (protocol) => {
  const getRpcResults = ({ to = OTHER, input = '0x', status = '0x1' } = {}) => ({
    eth_getTransactionByHash: {
      blockHash: '0xb10c000000000000000000000000000000000000000000000000000000000001',
      blockNumber: '0x121eac0',
      from: OWNER,
      gas: '0x7530',
      gasPrice: '0xb2d05e00',
      hash: HASH,
      input,
      nonce: '0x7',
      to,
      transactionIndex: '0x0',
      value: input === '0x' ? '0x6f05b59d3b20000' : '0x0',
      type: '0x0',
      v: '0x93',
      r: '0x1',
      s: '0x1',
    },
    eth_getBlockByHash: {
      hash: '0xb10c000000000000000000000000000000000000000000000000000000000001',
      number: '0x121eac0',
      timestamp: '0x65553f00',
      transactions: [],
    },
    eth_getTransactionReceipt: {
      blockHash: '0xb10c000000000000000000000000000000000000000000000000000000000001',
      blockNumber: '0x121eac0',
      transactionHash: HASH,
      transactionIndex: '0x0',
      from: OWNER,
      to,
      status,
      gasUsed: '0x5208',
      cumulativeGasUsed: '0x5208',
      effectiveGasPrice: '0x3b9aca00',
      logs: [],
      logsBloom: `0x${'0'.repeat(512)}`,
      type: '0x0',
    },
  });

  const adapter = ProtocolAdapterFactory.getAdapter(protocol);

  /** A result can be a function that throws, as a node error */
  function stubNode(rpcResults) {
    const requests = [];
    const web3Eth = new Web3Eth({
      request: async ({ method, params }) => {
        requests.push({ method, params });
        const result = rpcResults[method];
        return (typeof result === 'function' ? result() : result) ?? null;
      },
    });
    vi.spyOn(adapter, 'getWeb3EthInstance').mockReturnValue(web3Eth);
    return requests;
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a transfer of its coin with the fee paid', async () => {
    stubNode(getRpcResults());

    const { protocol: txProtocol, tx } = await adapter.fetchTransactionByHash(HASH, OWNER);

    expect(txProtocol).toBe(protocol);
    expect(tx.type).toBe('SpendTx');
    expect(tx.contractId).toBe(adapter.coinContractId);
    expect(tx.amount).toBe(0.5);
    // 21000 gas used × 1 gwei paid
    expect(tx.fee).toBe(0.000021);
    expect(tx.returnType).toBeUndefined();
  });

  it('asks for the block without its transactions', async () => {
    const requests = stubNode(getRpcResults());

    await adapter.fetchTransactionByHash(HASH, OWNER);

    const blockRequests = requests.filter(({ method }) => method === 'eth_getBlockByHash');
    expect(blockRequests).toHaveLength(1);
    expect(blockRequests[0].params[1]).toBe(false);
  });

  it('returns the transaction with the gas limit fee when its receipt fails to load', async () => {
    stubNode({
      ...getRpcResults(),
      eth_getTransactionReceipt: () => {
        throw new Error('Too Many Requests');
      },
    });

    const { pending, tx } = await adapter.fetchTransactionByHash(HASH, OWNER);

    expect(pending).toBe(false);
    // 30000 gas limit × 3 gwei
    expect(tx.fee).toBe(0.00009);
    expect(tx.returnType).toBeUndefined();
  });

  it('marks a reverted contract call', async () => {
    stubNode(getRpcResults({ to: CONTRACT, input: '0xa9059cbb', status: '0x0' }));
    // A reverted call moves no tokens, so Etherscan has no token transfer for it
    const tokenTransactionSpy = vi
      .spyOn(EtherscanService.prototype, 'fetchAccountTokenTransactionByHash')
      .mockResolvedValue(undefined);

    const { tx } = await adapter.fetchTransactionByHash(HASH, OWNER);

    expect(tokenTransactionSpy).toHaveBeenCalled();
    expect(tx.type).toBe('ContractCallTx');
    expect(tx.contractId).toBe(CONTRACT);
    expect(tx.returnType).toBe('revert');
    expect(tx.fee).toBe(0.000021);
  });
});
