// @ts-nocheck
import { ref } from 'vue';
import { MODAL_CONFIRM_CONNECT } from '@/constants';

vi.mock('@reown/walletkit', () => ({
  WalletKit: {
    init: vi.fn().mockResolvedValue({
      getActiveSessions: vi.fn(() => ({})),
      on: vi.fn(),
      emitSessionEvent: vi.fn().mockResolvedValue(undefined),
      updateSession: vi.fn().mockResolvedValue({ acknowledged: () => Promise.resolve() }),
      pair: vi.fn(),
      approveSession: vi.fn().mockResolvedValue({ topic: 't', namespaces: { eip155: { accounts: [], chains: [] } } }),
      rejectSession: vi.fn().mockResolvedValue(undefined),
      respondSessionRequest: vi.fn(),
    }),
  },
}));

// `Core` is instantiated with `new`; Vitest 4 requires a constructable
// implementation (an arrow function is not a constructor).
vi.mock('@walletconnect/core', () => ({ Core: vi.fn(class Core {}) }));

let activeAccountRef: any;
const openModalMock = vi.fn();

async function connectAndGetWallet(isConfirmRequired = false) {
  const { useWalletConnect } = await import('@/composables/walletConnect');
  await useWalletConnect().connect('wc:abc', isConfirmRequired);
  const anyWallet: any = (await import('@reown/walletkit')).WalletKit;
  return (anyWallet.init as vi.Mock).mock.results.at(-1).value;
}

function getLastHandler(web3wallet: any, event: string) {
  return (web3wallet.on as vi.Mock).mock.calls.filter(([name]) => name === event).at(-1)[1];
}

/** A dapp claiming a trusted dapp's URL in its WalletConnect metadata. */
const aescanProposal = {
  id: 1,
  params: {
    proposer: { metadata: { url: 'https://aescan.io', name: 'aeScan', icons: [] } },
    requiredNamespaces: { eip155: { methods: [], chains: ['eip155:1'], events: [] } },
  },
};

describe('WalletConnect accountsChanged behavior', () => {
  beforeEach(async () => {
    vi.resetModules();
    openModalMock.mockReset();
    // Mock constants and composables
    vi.doMock('@/constants', async () => ({
      ...(await vi.importActual('@/constants')),
      APP_NAME: 'Superhero',
      APP_URL: 'superhero.com',
      EVM_PROTOCOLS: ['ethereum'],
      PROTOCOLS: { ethereum: 'ethereum' },
      STORAGE_KEYS: { walletConnectSession: 'wc' },
      WALLET_CONNECT_PROJECT_ID: 'pid',
    }));
    // Mock auth composable dependency chain
    vi.doMock('@/composables/auth', () => ({ useAuth: () => ({ isLoggedIn: { value: true }, secureLoginTimeoutDecrypted: { value: 0 } }) }));
    vi.doMock('@/composables', () => ({
      useAccounts: vi.fn(), useNetworks: vi.fn(), useModals: vi.fn(), useAuth: vi.fn(),
    }));
    const accountsGroupedByProtocol = ref({
      ethereum: [
        { address: '0xaaa', protocol: 'ethereum' },
        { address: '0xbbb', protocol: 'ethereum' },
      ],
    });
    activeAccountRef = ref({ address: '0xbbb', protocol: 'ethereum' });
    const activeNetwork = ref({ name: 'Main' });
    const networks = ref({ Main: { protocols: { ethereum: { chainId: '1' } } } });
    vi.doMock('@/composables/accounts', () => ({ useAccounts: () => ({ activeAccount: activeAccountRef, accountsGroupedByProtocol, getLastActiveProtocolAccount: () => ({ address: '0xbbb' }) }) }));
    vi.doMock('@/composables/networks', () => ({ useNetworks: () => ({ activeNetwork, networks }) }));
    vi.doMock('@/popup/plugins/i18n', () => ({ tg: (k: string) => k }));
    vi.doMock('@/composables/modals', () => ({ useModals: () => ({ openDefaultModal: vi.fn(), openModal: openModalMock }) }));
  });

  afterEach(() => {
    [
      '@/constants',
      '@/composables/auth',
      '@/composables',
      '@/composables/accounts',
      '@/composables/networks',
      '@/popup/plugins/i18n',
      '@/composables/modals',
    ].forEach((path) => vi.doUnmock(path));
  });

  it('approves session with events and orders accounts by last active', async () => {
    const { useWalletConnect } = await import('@/composables/walletConnect');
    const wc = useWalletConnect();

    // Start connect flow and simulate proposal
    await wc.connect('wc:abc');
    const anyWallet: any = (await import('@reown/walletkit')).WalletKit;
    const web3wallet = await (anyWallet.init as vi.Mock).mock.results[0].value;

    // Trigger session_proposal handler
    const onMock = web3wallet.on as vi.Mock;
    const sessionProposalHandler = onMock.mock.calls.find((args: any[]) => args[0] === 'session_proposal')[1];
    await sessionProposalHandler({
      id: 1,
      params: {
        proposer: { metadata: { url: 'https://app.uniswap.org', icons: [] } },
        requiredNamespaces: { eip155: { methods: [], chains: ['eip155:1'], events: [] } },
      },
    });

    const approveArgs = (web3wallet.approveSession as vi.Mock).mock.calls[0][0];
    const ns = approveArgs.namespaces.eip155;
    // Some WC utils may strip unrequested events; ensure events array exists
    expect(Array.isArray(ns.events)).toBe(true);
    expect(ns.accounts[0]).toBe('eip155:1:0xbbb');
  });

  it('marks the proposal URL as self-reported in the connect modal', async () => {
    const web3wallet = await connectAndGetWallet(true);
    await getLastHandler(web3wallet, 'session_proposal')(aescanProposal);

    expect(openModalMock).toHaveBeenCalledWith(MODAL_CONFIRM_CONNECT, expect.objectContaining({
      app: {
        host: 'aescan.io',
        name: 'aescan.io',
        protocol: 'https:',
        href: 'https://aescan.io/',
        originSource: 'self-reported',
      },
    }));
  });
});

describe('WalletConnect dapp requests', () => {
  const account = { address: '0xbbb', protocol: 'ethereum' };

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    openModalMock.mockReset().mockResolvedValue({});
    vi.doMock('@/constants', async () => ({
      ...(await vi.importActual('@/constants')),
      WALLET_CONNECT_PROJECT_ID: 'pid',
    }));
    const activeNetwork = ref({
      name: 'Main',
      type: 'mainnet',
      protocols: { ethereum: { chainId: '1', nodeUrl: 'https://eth.rpc' } },
    });
    vi.doMock('@/composables/accounts', () => ({
      useAccounts: () => ({
        activeAccount: ref(account),
        accountsGroupedByProtocol: ref({ ethereum: [account] }),
        getLastActiveProtocolAccount: () => account,
      }),
    }));
    vi.doMock('@/composables/networks', () => ({
      useNetworks: () => ({
        activeNetwork,
        activeNetworkName: ref('Main'),
        networks: ref({ Main: activeNetwork.value }),
        switchNetwork: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/modals', () => ({ useModals: () => ({ openDefaultModal: vi.fn(), openModal: openModalMock }) }));
  });

  afterEach(() => {
    [
      '@/constants',
      '@/composables/accounts',
      '@/composables/networks',
      '@/composables/modals',
    ].forEach((path) => vi.doUnmock(path));
    vi.unstubAllGlobals();
  });

  /** Returns what the wallet responds to a request of the dapp of an approved session */
  async function request(method: string, params: unknown[]) {
    const web3wallet = await connectAndGetWallet();
    (web3wallet.approveSession as vi.Mock).mockResolvedValueOnce({
      topic: 't',
      namespaces: { eip155: { accounts: [], chains: [] } },
      peer: { metadata: aescanProposal.params.proposer.metadata },
    });
    await getLastHandler(web3wallet, 'session_proposal')(aescanProposal);
    (web3wallet.getActiveSessions as vi.Mock).mockReturnValue({ t: {} });
    (web3wallet.respondSessionRequest as vi.Mock).mockClear();
    await getLastHandler(web3wallet, 'session_request')({
      id: 2,
      topic: 't',
      params: { chainId: 'eip155:1', request: { method, params } },
    });
    return (web3wallet.respondSessionRequest as vi.Mock).mock.calls.at(-1)?.[0];
  }

  it.each([
    'eth_requestAccounts',
    'wallet_requestPermissions',
  ])('%s shows the claimed URL as self-reported in the connect modal', async (method) => {
    await request(method, []);

    expect(openModalMock).toHaveBeenCalledWith(MODAL_CONFIRM_CONNECT, expect.objectContaining({
      app: expect.objectContaining({ host: 'aescan.io', originSource: 'self-reported' }),
    }));
  });

  it('answers a read of the node with its null result, not an error', async () => {
    const fetchMock = vi.fn(async () => ({ status: 200, json: async () => ({ jsonrpc: '2.0', id: 1, result: null }) }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await request('eth_getTransactionReceipt', ['0x01']))
      .toEqual({ topic: 't', response: { id: 2, jsonrpc: '2.0', result: null } });
    expect(fetchMock).toHaveBeenCalledWith('https://eth.rpc', expect.anything());
  });
});
