/**
 * A dapp's `eth_sendTransaction` through the real handler, adapters and accounts.
 * Only the chain nodes and the confirmation modal are faked.
 */
import { ref } from 'vue';
import { mnemonicToSeedSync } from '@scure/bip39';
import HttpProvider from 'web3-providers-http';
import { Transaction, TransactionFactory } from 'web3-eth-accounts';
import {
  bytesToHex,
  hexToBytes,
  keccak256,
  numberToHex,
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
    encryptionKey: ref(undefined),
  }),
}));
vi.mock('@/composables/modals', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/composables/modals')>();
  return { ...actual, useModals: () => ({ ...actual.useModals(), openModal }) };
});

const DAPP = 'https://dapp.example';
const GAS_PRICE = 27_500_000_000n;
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
    eth_getTransactionCount: () => numberToHex(NONCE),
    eth_call: () => '0x',
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
      gasPrice: GAS_PRICE,
    });
    // Counting the pending transactions of the sender
    const nonceRequests = getNodeRequests('eth_getTransactionCount')
      .map(({ url, params }) => [url, params[0].toLowerCase(), params[1]]);
    expect(nonceRequests).toEqual([[nodeUrl, from.toLowerCase(), 'pending']]);
    expect(openModal).toHaveBeenCalledOnce();
    expect(openModal.mock.calls[0]).toMatchObject([
      MODAL_CONFIRM_TRANSACTION_SIGN,
      { protocol, fromAccount: from, tx: { recipientId: TX.to } },
    ]);
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
