/**
 * A dapp's `eth_sendTransaction` through the real handler, adapters and accounts.
 * Only the chain nodes and the confirmation modal are faked.
 */
import { ref } from 'vue';
import { mnemonicToSeedSync } from '@scure/bip39';
import { Tag } from '@aeternity/aepp-sdk';
import HttpProvider from 'web3-providers-http';
import { FeeMarketEIP1559Transaction, Transaction, TransactionFactory } from 'web3-eth-accounts';
import {
  bytesToHex,
  hexToBytes,
  keccak256,
  numberToHex,
  toChecksumAddress,
} from 'web3-utils';

import type { Protocol } from '@/types';
import {
  ACCOUNT_TYPES,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  PERMISSION_DEFAULTS,
  PROTOCOLS,
  STORAGE_KEYS,
} from '@/constants';
import { WalletStorage } from '@/lib/WalletStorage';
import { BNB_CONTRACT_ID } from '@/protocols/bnb/config';
import { watchUntilTruthy } from '@/utils';

const { openModal } = vi.hoisted(() => {
  // The setup files already loaded the app; load it again with the mocks below
  vi.resetModules();
  return { openModal: vi.fn() };
});

const MNEMONIC_SEED = mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');

vi.mock('@/composables/auth', () => ({
  useAuth: () => ({
    mnemonic: ref(''),
    mnemonicSeed: ref(MNEMONIC_SEED),
    isMnemonicRestored: ref(true),
    isAuthenticated: ref(true),
    isMnemonicUnreadable: ref(false),
    encryptionKey: ref(undefined),
    isEncryptionKeyCurrent: () => true,
  }),
}));
vi.mock('@/composables/modals', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/composables/modals')>();
  return { ...actual, useModals: () => ({ ...actual.useModals(), openModal }) };
});

const DAPP = 'https://dapp.example';
const GAS_PRICE = 27_500_000_000n;
/** The node price raised by a tenth, as the send form does */
const SIGNED_GAS_PRICE = 30_250_000_000n;
/** Of the latest Ethereum block */
const BASE_FEE = 10_000_000_000n;
const TIP = 1_500_000_000n;
const NONCE = 7n;
const TX = {
  to: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
  value: '0x2386f26fc10000',
  // transfer(0x8ba1…BA72, 1000)
  data: '0xa9059cbb0000000000000000000000008ba1f109551bd432803012645ac136ddd64dba7200000000000000000000000000000000000000000000000000000000000003e8',
  gas: '0x186a0',
};

interface INodeRequest { url: string; method: string; params: any[] }

let nodeRequests: INodeRequest[] = [];
let nodeErrors: Record<string, { code: number; message: string }> = {};

/** Answers JSON-RPC requests like the node of a chain would */
function answerNodeRequest(url: string, { id, method, params }: any) {
  nodeRequests.push({ url, method, params });
  const results: Record<string, () => unknown> = {
    eth_estimateGas: () => '0x5208',
    eth_gasPrice: () => numberToHex(GAS_PRICE),
    eth_maxPriorityFeePerGas: () => numberToHex(TIP),
    eth_getBlockByNumber: () => ({
      number: '0x1',
      hash: `0x${'1'.repeat(64)}`,
      parentHash: `0x${'0'.repeat(64)}`,
      timestamp: '0x65553f00',
      gasLimit: '0x1c9c380',
      gasUsed: '0x0',
      baseFeePerGas: numberToHex(BASE_FEE),
      transactions: [],
    }),
    eth_getTransactionCount: () => numberToHex(NONCE),
    // `decimals()` of a token: 18
    eth_call: () => (params[0]?.data?.startsWith('0x313ce567') ? `0x${'12'.padStart(64, '0')}` : '0x'),
    eth_sendRawTransaction: () => keccak256(params[0]),
    eth_blockNumber: () => '0x1',
    // Mined, so that web3 stops waiting for it
    eth_getTransactionReceipt: () => ({
      transactionHash: params[0],
      transactionIndex: '0x0',
      blockHash: `0x${'1'.repeat(64)}`,
      blockNumber: '0x1',
      cumulativeGasUsed: '0x5208',
      gasUsed: '0x5208',
      effectiveGasPrice: numberToHex(GAS_PRICE),
      logs: [],
      logsBloom: `0x${'0'.repeat(512)}`,
      status: '0x1',
      type: '0x0',
    }),
  };
  if (nodeErrors[method]) return { jsonrpc: '2.0', id, error: nodeErrors[method] };
  if (!results[method]) return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } };
  return { jsonrpc: '2.0', id, result: results[method]() };
}

function getNodeRequests(method: string) {
  return nodeRequests.filter((request) => request.method === method);
}

function decodeTransaction(raw: string) {
  const tx = TransactionFactory.fromSerializedData(hexToBytes(raw));
  return {
    type: tx.type,
    chainId: tx.common.chainId(),
    from: tx.getSenderAddress().toString(),
    nonce: tx.nonce,
    to: tx.to?.toString(),
    value: tx.value,
    data: bytesToHex(tx.data),
    gasLimit: tx.gasLimit,
    gasPrice: (tx as Transaction).gasPrice,
  };
}

WalletStorage.set(STORAGE_KEYS.accountsRaw, [
  PROTOCOLS.avalanche,
  PROTOCOLS.avalanche,
  PROTOCOLS.bnb,
  PROTOCOLS.polygonPos,
  PROTOCOLS.ethereum,
].map((protocol) => ({ protocol, type: ACCOUNT_TYPES.hdWallet, isRestored: true })));
// The second Avalanche account
WalletStorage.set(STORAGE_KEYS.activeAccountGlobalIdx, 1);
WalletStorage.set(STORAGE_KEYS.permissions, {
  [new URL(DAPP).host]: {
    ...PERMISSION_DEFAULTS,
    host: new URL(DAPP).host,
    name: 'Dapp',
    address: true,
  },
  'secure.example': {
    ...PERMISSION_DEFAULTS,
    host: 'secure.example',
    name: 'Secure',
    address: true,
    protocol: 'https:',
  },
});

await import('@/protocols/registerAdapters');
const { handleEvmRpcRequest } = await import('@/protocols/evm/libs/EvmRpcMethodsHandler');
const { useAccounts, useNetworks } = await import('@/composables');

describe('eth_sendTransaction of a dapp', () => {
  beforeAll(async () => {
    vi.spyOn(HttpProvider.prototype, 'request').mockImplementation(
      async function request(this: any, payload: any) {
        return answerNodeRequest(this.clientUrl, payload);
      } as any,
    );
    // The handler estimates the gas by itself
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => ({
      ok: true,
      status: 200,
      json: async () => answerNodeRequest(url, JSON.parse(init.body as string)),
    }));
    await watchUntilTruthy(useAccounts().areAccountsReady);
    expect(useAccounts().activeAccount.value)
      .toMatchObject({ protocol: PROTOCOLS.avalanche, idx: 1 });
  });

  beforeEach(() => {
    nodeRequests = [];
    nodeErrors = {};
    openModal.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    useNetworks().switchNetwork('Mainnet');
  });

  afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function getChain(protocol: Protocol) {
    const { nodeUrl } = useNetworks().activeNetwork.value.protocols[protocol] as any;
    // The account the dapp was given
    const from = useAccounts().getLastActiveProtocolAccount(protocol)!.address;
    return { nodeUrl, from };
  }

  it('signs nothing when the network was switched while the user confirmed', async () => {
    useNetworks().switchNetwork('Testnet');
    const { from } = getChain(PROTOCOLS.avalanche);
    // As a dapp's `wallet_switchEthereumChain` while the modal is open
    openModal.mockImplementation(async () => { useNetworks().switchNetwork('Mainnet'); });

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ from, ...TX }], 'Dapp', 'eip155:43113');

    // Refused after the confirmation, not by the check before it
    expect(openModal).toHaveBeenCalledOnce();
    expect(response.error).toMatchObject({ code: -32602 });
    expect(getNodeRequests('eth_sendRawTransaction')).toEqual([]);
  });

  it.each([
    ['Avalanche C-Chain', 'Mainnet', PROTOCOLS.avalanche, 43114],
    ['Avalanche Fuji', 'Testnet', PROTOCOLS.avalanche, 43113],
    ['BNB Smart Chain', 'Mainnet', PROTOCOLS.bnb, 56],
    ['Polygon PoS', 'Mainnet', PROTOCOLS.polygonPos, 137],
  ])('sends the transaction the user approved on %s', async (_, networkName, protocol, chainId) => {
    useNetworks().switchNetwork(networkName);
    const { nodeUrl, from } = getChain(protocol);

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ from, ...TX }], 'Dapp', `eip155:${chainId}`);

    expect(response.error).toBeUndefined();
    const sent = getNodeRequests('eth_sendRawTransaction');
    expect(sent.map(({ url }) => url)).toEqual([nodeUrl]);
    const [{ params: [raw] }] = sent;
    expect(response).toEqual({ result: keccak256(raw) });
    expect(decodeTransaction(raw)).toEqual({
      type: 0,
      chainId: BigInt(chainId),
      from: from.toLowerCase(),
      nonce: NONCE,
      to: TX.to.toLowerCase(),
      value: BigInt(TX.value),
      data: TX.data,
      gasLimit: BigInt(TX.gas),
      gasPrice: SIGNED_GAS_PRICE,
    });
    // Counting the pending transactions of the sender
    const nonceRequests = getNodeRequests('eth_getTransactionCount')
      .map(({ url, params }) => [url, params[0].toLowerCase(), params[1]]);
    expect(nonceRequests).toEqual([[nodeUrl, from.toLowerCase(), 'pending']]);
    expect(openModal).toHaveBeenCalledOnce();
    expect(openModal.mock.calls[0]).toMatchObject([
      MODAL_CONFIRM_TRANSACTION_SIGN,
      {
        protocol,
        fromAccount: from,
        // 100 000 gas at the signed gas price, the node's + 10%
        tx: { recipientId: TX.to, fee: expect.closeTo(0.003025, 15), gas: 100000 },
      },
    ]);
  });

  it('signs the gas price shown, not the one a dapp set, on BNB Smart Chain', async () => {
    const { from } = getChain(PROTOCOLS.bnb);

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{
      from, ...TX, gasPrice: '0x1', maxFeePerGas: '0x6fc23ac00',
    }], 'Dapp', 'eip155:56');

    expect(response.error).toBeUndefined();
    const [{ params: [raw] }] = getNodeRequests('eth_sendRawTransaction');
    expect(decodeTransaction(raw).gasPrice).toBe(SIGNED_GAS_PRICE);
    expect(getNodeRequests('eth_gasPrice')).toHaveLength(1);
    expect(openModal.mock.calls[0][1].tx.fee).toBeCloseTo(0.003025, 15);
  });

  it('signs the Ethereum fees shown, not the ones a dapp set', async () => {
    const { from } = getChain(PROTOCOLS.ethereum);

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{
      from, ...TX, maxFeePerGas: '0x6fc23ac00', maxPriorityFeePerGas: '0x77359400',
    }], 'Dapp', 'eip155:1');

    expect(response.error).toBeUndefined();
    const [{ params: [raw] }] = getNodeRequests('eth_sendRawTransaction');
    const tx = TransactionFactory
      .fromSerializedData(hexToBytes(raw)) as FeeMarketEIP1559Transaction;
    expect(tx.type).toBe(2);
    expect(tx.common.chainId()).toBe(1n);
    // Twice the base fee plus the node tip, plus the tip of the slow speed
    expect(tx.maxFeePerGas).toBe(23_000_000_000n);
    expect(tx.maxPriorityFeePerGas).toBe(TIP);
    expect(tx.gasLimit).toBe(BigInt(TX.gas));
    // The most the gas limit can cost at the max fee
    expect(openModal.mock.calls[0][1].tx.fee).toBeCloseTo(0.0023, 15);
  });

  it('sends a transfer with the gas estimated by the node', async () => {
    const { from } = getChain(PROTOCOLS.avalanche);

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ from, to: TX.to, value: TX.value }], 'Dapp', 'eip155:43114');

    expect(response.error).toBeUndefined();
    const [{ params: [raw] }] = getNodeRequests('eth_sendRawTransaction');
    expect(response).toEqual({ result: keccak256(raw) });
    // 21000 plus 15% headroom
    expect(decodeTransaction(raw)).toMatchObject({ gasLimit: 24150n, data: '0x', value: BigInt(TX.value) });
  });

  it('sends the call data a dapp passed as `input`', async () => {
    const { from } = getChain(PROTOCOLS.avalanche);
    const { data: input, gas, ...tx } = TX;

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ from, ...tx, input }], 'Dapp', 'eip155:43114');

    expect(response.error).toBeUndefined();
    const [{ params: [estimation] }] = getNodeRequests('eth_estimateGas');
    expect(estimation.data).toBe(input);
    const [{ params: [raw] }] = getNodeRequests('eth_sendRawTransaction');
    expect(decodeTransaction(raw).data).toBe(input);
    expect(openModal.mock.calls[0][1].tx).toMatchObject({ data: input, type: 'ContractCallTx' });
  });

  it.each([
    ['hex without 0x', TX.data.slice(2)],
    ['a number', 12345],
    // The confirmation can't read it, and the signer throws on it
    ['an array of hex', [TX.data]],
  ])('refuses call data that is %s', async (_, data) => {
    const { from } = getChain(PROTOCOLS.bnb);

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ ...TX, from, data }], 'Dapp', 'eip155:56');

    expect(response.error).toMatchObject({ code: -32602 });
    expect(openModal).not.toHaveBeenCalled();
    expect(getNodeRequests('eth_estimateGas')).toEqual([]);
    expect(getNodeRequests('eth_sendRawTransaction')).toEqual([]);
  });

  it.each([
    ['empty call data as a transfer', '', '0x'],
    ['call data in upper-case hex', `0x${TX.data.slice(2).toUpperCase()}`, TX.data],
  ])('signs %s', async (_, data, signed) => {
    const { from } = getChain(PROTOCOLS.bnb);

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ ...TX, from, data }], 'Dapp', 'eip155:56');

    expect(response.error).toBeUndefined();
    const [{ params: [raw] }] = getNodeRequests('eth_sendRawTransaction');
    expect(decodeTransaction(raw).data).toBe(signed);
  });

  it.each(['0x', '', undefined])('shows call data %j as a coin transfer', async (data) => {
    const { from } = getChain(PROTOCOLS.bnb);

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ ...TX, from, data }], 'Dapp', 'eip155:56');

    expect(response.error).toBeUndefined();
    const { tx } = openModal.mock.calls[0][1];
    expect(tx).toMatchObject({ tag: Tag.SpendTx, type: 'SpendTx', contractId: BNB_CONTRACT_ID });
    expect(tx.data).toBeUndefined();
    const [{ params: [raw] }] = getNodeRequests('eth_sendRawTransaction');
    expect(decodeTransaction(raw).data).toBe('0x');
  });

  it('shows, estimates and signs odd-length call data with a 0 in front, as MetaMask does', async () => {
    const { from } = getChain(PROTOCOLS.bnb);
    const { gas, ...tx } = TX;
    // approve(spender, max) with the 0 of its selector left out
    const approve = `95ea7b3${'1'.padStart(64, '0')}${'f'.repeat(64)}`;

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ ...tx, from, data: `0x${approve}` }], 'Dapp', 'eip155:56');

    expect(response.error).toBeUndefined();
    const padded = `0x0${approve}`;
    expect(getNodeRequests('eth_estimateGas')[0].params[0].data).toBe(padded);
    expect(openModal.mock.calls[0][1].tx.data).toBe(padded);
    expect(openModal.mock.calls[0][1].evmCall.data).toBe(padded);
    const [{ params: [raw] }] = getNodeRequests('eth_sendRawTransaction');
    expect(decodeTransaction(raw).data).toBe(padded);
  });

  it('hands the confirmation the call as it will be signed', async () => {
    const { from } = getChain(PROTOCOLS.bnb);
    const { gas, ...tx } = TX;
    // More than a double holds exactly
    const value = '0x2386f26fc10001';

    await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ from, ...tx, value }], 'Dapp', 'eip155:56');

    const { evmCall } = openModal.mock.calls[0][1];
    // 21000 estimated plus 15% headroom
    expect(evmCall).toEqual({
      from,
      to: TX.to,
      value,
      data: TX.data,
      gas: '0x5e56',
      chainId: '56',
      gasPrice: numberToHex(SIGNED_GAS_PRICE),
    });
    expect(JSON.parse(JSON.stringify(evmCall))).toEqual(evmCall);
    const [{ params: [raw] }] = getNodeRequests('eth_sendRawTransaction');
    expect(decodeTransaction(raw)).toMatchObject({
      value: BigInt(evmCall.value),
      gasLimit: BigInt(evmCall.gas),
      data: evmCall.data,
      gasPrice: BigInt(evmCall.gasPrice),
    });
  });

  it('hands the confirmation the Ethereum call as it will be signed', async () => {
    const { from } = getChain(PROTOCOLS.ethereum);
    const { gas, ...tx } = TX;
    const value = '0x2386f26fc10001';

    await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ from, ...tx, value }], 'Dapp', 'eip155:1');

    const { evmCall } = openModal.mock.calls[0][1];
    expect(evmCall.value).toBe(value);
    const [{ params: [raw] }] = getNodeRequests('eth_sendRawTransaction');
    // Ethereum has a signer of its own
    const signed = TransactionFactory
      .fromSerializedData(hexToBytes(raw)) as FeeMarketEIP1559Transaction;
    expect(signed.type).toBe(2);
    expect(evmCall).toEqual({
      from: toChecksumAddress(signed.getSenderAddress().toString()),
      to: toChecksumAddress(signed.to!.toString()),
      value: numberToHex(signed.value),
      data: bytesToHex(signed.data),
      gas: numberToHex(signed.gasLimit),
      chainId: String(signed.common.chainId()),
      maxFeePerGas: numberToHex(signed.maxFeePerGas),
      maxPriorityFeePerGas: numberToHex(signed.maxPriorityFeePerGas),
    });
  });

  it.each([
    ['no value', undefined, '0x0', 0n],
    ['a JSON number', 1000, '0x3e8', 1000n],
    ['hex with leading zeros', '0x03e8', '0x3e8', 1000n],
    ['more than a double holds', '0x2386f26fc10001', '0x2386f26fc10001', 10000000000000001n],
  ])('signs %s as the confirmation shows it', async (_, value, shown, signed) => {
    const { from } = getChain(PROTOCOLS.bnb);

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ ...TX, from, value }], 'Dapp', 'eip155:56');

    expect(response.error).toBeUndefined();
    expect(openModal.mock.calls[0][1].evmCall.value).toBe(shown);
    const [{ params: [raw] }] = getNodeRequests('eth_sendRawTransaction');
    expect(decodeTransaction(raw).value).toBe(signed);
  });

  it.each([
    ['a decimal value', '1000', '0x3e8'],
    ['an upper-case hex value', '0X10', '0x10'],
  ])('signs nothing for %s, which the signer can not read', async (_, value, shown) => {
    const { from } = getChain(PROTOCOLS.bnb);

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ ...TX, from, value }], 'Dapp', 'eip155:56');

    // Read otherwise, e.g. as hex as MetaMask does, it would differ from what is shown
    expect(openModal.mock.calls[0][1].evmCall.value).toBe(shown);
    expect(response.error).toMatchObject({ code: -32603 });
    expect(getNodeRequests('eth_sendRawTransaction')).toEqual([]);
  });

  it('hands the confirmation no call where the value is no quantity', async () => {
    const { from } = getChain(PROTOCOLS.bnb);

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ ...TX, from, value: '-1' }], 'Dapp', 'eip155:56');

    expect(openModal).toHaveBeenCalledTimes(1);
    expect(openModal.mock.calls[0][1].evmCall).toBeUndefined();
    expect(response.error).toBeDefined();
    expect(getNodeRequests('eth_sendRawTransaction')).toEqual([]);
  });

  it('sends nothing when the user rejects', async () => {
    openModal.mockRejectedValue(new Error('Rejected by user'));
    const { from } = getChain(PROTOCOLS.avalanche);

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ from, ...TX }], 'Dapp', 'eip155:43114');

    expect(response).toEqual({ error: { code: 4001, message: 'User have rejected the request' } });
    expect(getNodeRequests('eth_getTransactionCount')).toEqual([]);
    expect(getNodeRequests('eth_sendRawTransaction')).toEqual([]);
  });

  it('treats the http page of a site connected over https as not connected', async () => {
    const { from } = getChain(PROTOCOLS.avalanche);

    expect(await handleEvmRpcRequest('http://secure.example', 'eth_accounts', [], 'Dapp', 'eip155:43114'))
      .toEqual({ result: [] });
    expect(await handleEvmRpcRequest('http://secure.example', 'eth_sendTransaction', [{ from, ...TX }], 'Dapp', 'eip155:43114'))
      .toMatchObject({ error: { code: 4100 } });
    expect(await handleEvmRpcRequest('https://secure.example', 'eth_accounts', [], 'Dapp', 'eip155:43114'))
      .toEqual({ result: [from] });
    expect(openModal).not.toHaveBeenCalled();
  });

  it('keeps the connection of a site over https when its http page revokes', async () => {
    const { from } = getChain(PROTOCOLS.avalanche);

    expect(await handleEvmRpcRequest('http://secure.example', 'wallet_revokePermissions', [{ eth_accounts: {} }]))
      .toEqual({ result: null });
    expect(await handleEvmRpcRequest('https://secure.example', 'eth_accounts', [], 'Dapp', 'eip155:43114'))
      .toEqual({ result: [from] });
  });

  it('returns the error of the node that refused the transaction', async () => {
    nodeErrors.eth_sendRawTransaction = { code: -32000, message: 'insufficient funds for gas * price + value' };
    const { from } = getChain(PROTOCOLS.avalanche);

    const response = await handleEvmRpcRequest(DAPP, 'eth_sendTransaction', [{ from, ...TX }], 'Dapp', 'eip155:43114');

    expect(response).toEqual({
      error: { code: -32603, message: expect.stringContaining('insufficient funds') },
    });
  });
});

describe('an Avalanche token transfer of the wallet', () => {
  beforeAll(() => {
    vi.spyOn(HttpProvider.prototype, 'request').mockImplementation(
      async function request(this: any, payload: any) {
        return answerNodeRequest(this.clientUrl, payload);
      } as any,
    );
  });

  beforeEach(() => {
    nodeRequests = [];
    nodeErrors = {};
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('sends the token transfer the user asked for', async () => {
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.avalanche);
    const from = useAccounts().getLastActiveProtocolAccount(PROTOCOLS.avalanche)!.address;
    const token = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E';

    const { hash } = await adapter.transferToken!('1.5', TX.to, token, {
      fromAccount: from,
      maxFeePerGas: '0.00000003',
      maxPriorityFeePerGas: '0',
      nonce: 4,
    });

    const [{ params: [raw] }] = getNodeRequests('eth_sendRawTransaction');
    expect(hash).toBe(keccak256(raw));
    const transferData = `0xa9059cbb${TX.to.slice(2).toLowerCase().padStart(64, '0')}${(15n * 10n ** 17n).toString(16).padStart(64, '0')}`;
    expect(decodeTransaction(raw)).toMatchObject({
      chainId: 43114n,
      from: from.toLowerCase(),
      nonce: 4n,
      to: token.toLowerCase(),
      value: 0n,
      data: transferData,
      gasPrice: 30_000_000_000n,
    });
  });
});
