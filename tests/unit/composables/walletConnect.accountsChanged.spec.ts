// @ts-nocheck
import { ref } from 'vue';
import { MODAL_CONFIRM_CONNECT } from '@/constants';

vi.mock('@reown/walletkit', () => ({
  WalletKit: {
    init: vi.fn().mockResolvedValue({
      getActiveSessions: vi.fn(() => ({})),
      on: vi.fn(),
      off: vi.fn(),
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

  it('leaves the proposal of a pairing to the listener of that pairing', async () => {
    const { useWalletConnect } = await import('@/composables/walletConnect');
    const wc = useWalletConnect();
    // Paired without a confirmation, but its dapp never sent a proposal
    await wc.connect('wc:first@2?relay-protocol=irn&symKey=aa');
    await wc.connect('wc:second@2?relay-protocol=irn&symKey=bb', true);
    const anyWallet: any = (await import('@reown/walletkit')).WalletKit;
    const web3wallet = await (anyWallet.init as vi.Mock).mock.results[0].value;
    const [firstListener, secondListener] = (web3wallet.on as vi.Mock).mock.calls
      .filter(([name]) => name === 'session_proposal')
      .map(([, listener]) => listener)
      .slice(-2);
    const proposal = {
      ...aescanProposal,
      params: { ...aescanProposal.params, pairingTopic: 'second' },
    };

    // The spies of the wallet double are shared with the other tests
    const approvals = web3wallet.approveSession.mock.calls.length;

    await firstListener(proposal);
    expect(web3wallet.approveSession.mock.calls.length).toBe(approvals);

    await secondListener(proposal);
    expect(openModalMock).toHaveBeenCalledWith(MODAL_CONFIRM_CONNECT, expect.anything());
    expect(web3wallet.approveSession.mock.calls.length).toBe(approvals + 1);
    expect(web3wallet.off).toHaveBeenCalledWith('session_proposal', secondListener);
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
  /** Holds keccak256('cow') */
  const account = {
    address: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    protocol: 'ethereum',
    secretKey: Buffer.from('c85ef7d79691fe79573b1a7064c19c1a9819ebdbd1faaab1a8ec92344438aaf4', 'hex'),
  };

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
        getAccountByProtocolAndAddress: (_: string, address: string) => (
          address === account.address ? account : undefined
        ),
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

  /** Approves a session and returns a function giving what the wallet responds to its dapp */
  async function approveSession(isConfirmRequired = false) {
    const web3wallet = await connectAndGetWallet(isConfirmRequired);
    (web3wallet.approveSession as vi.Mock).mockResolvedValueOnce({
      topic: 't',
      namespaces: { eip155: { accounts: [], chains: [] } },
      peer: { metadata: aescanProposal.params.proposer.metadata },
    });
    await getLastHandler(web3wallet, 'session_proposal')(aescanProposal);
    (web3wallet.getActiveSessions as vi.Mock).mockReturnValue({ t: { topic: 't' } });
    let id = 1;
    return async (method: string, params: unknown[]) => {
      id += 1;
      (web3wallet.respondSessionRequest as vi.Mock).mockClear();
      await getLastHandler(web3wallet, 'session_request')({
        id,
        topic: 't',
        params: { chainId: 'eip155:1', request: { method, params } },
      });
      return (web3wallet.respondSessionRequest as vi.Mock).mock.calls.at(-1)?.[0];
    };
  }

  async function request(method: string, params: unknown[]) {
    return (await approveSession())(method, params);
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

  it('asks to connect once per session', async () => {
    const send = await approveSession();

    expect((await send('eth_requestAccounts', [])).response.result).toEqual([account.address]);
    expect((await send('eth_requestAccounts', [])).response.result).toEqual([account.address]);
    expect(openModalMock).toHaveBeenCalledOnce();
  });

  it('does not ask to connect again after the user confirmed the session', async () => {
    const send = await approveSession(true);

    expect((await send('eth_requestAccounts', [])).response.result).toEqual([account.address]);
    expect(openModalMock).toHaveBeenCalledOnce();
  });

  it('gives the account of the session to eth_accounts', async () => {
    const send = await approveSession();

    expect((await send('eth_accounts', [])).response.result).toEqual([account.address]);
  });

  it('asks to connect again after the dapp revoked its permissions', async () => {
    const send = await approveSession();
    await send('eth_requestAccounts', []);
    await send('wallet_revokePermissions', []);

    expect((await send('eth_requestAccounts', [])).response.result).toEqual([account.address]);
    expect(openModalMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the permission of the website whose URL the dapp claims', async () => {
    const send = await approveSession();
    const { usePermissions } = await import('@/composables/permissions');
    const { permissions, addPermission } = usePermissions();
    addPermission({ host: 'aescan.io', address: true } as any);

    expect((await send('wallet_revokePermissions', [])).response.result).toBeNull();
    expect(permissions.value['aescan.io']).toEqual({ host: 'aescan.io', address: true });
  });

  it('answers a read of the node with its null result, not an error', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ jsonrpc: '2.0', id: 1, result: null }) }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await request('eth_getTransactionReceipt', ['0x01']))
      .toEqual({ topic: 't', response: { id: 2, jsonrpc: '2.0', result: null } });
    expect(fetchMock).toHaveBeenCalledWith('https://eth.rpc', expect.anything());
  });

  it('answers the rejection of the user as an error', async () => {
    openModalMock.mockRejectedValue(new Error('Rejected'));

    expect(await request('personal_sign', ['0x68656c6c6f', account.address])).toMatchObject({
      response: { id: 2, error: { code: 4001 } },
    });
  });

  it('signs a message with the account the dapp names', async () => {
    expect(await request('personal_sign', ['0x68656c6c6f', account.address])).toEqual({
      topic: 't',
      response: {
        id: 2,
        jsonrpc: '2.0',
        // By `@metamask/eth-sig-util` personalSign of "hello"
        result: '0x2452a50a1b27db559e685e82ef59445ff08ca6843b5089aa1c32a70db206d47d693e5ae94daffccbbf590c5d2a72ad5706994748d2c8d3a8b39355589e16e8751c',
      },
    });
  });

  it('signs typed data the dapp sends as an object', async () => {
    // The example of the EIP-712 spec, and its signature
    const mail = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Person: [{ name: 'name', type: 'string' }, { name: 'wallet', type: 'address' }],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
      },
      primaryType: 'Mail',
      domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      message: {
        from: { name: 'Cow', wallet: account.address },
        to: { name: 'Bob', wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB' },
        contents: 'Hello, Bob!',
      },
    };

    expect(await request('eth_signTypedData_v4', [account.address, mail])).toEqual({
      topic: 't',
      response: {
        id: 2,
        jsonrpc: '2.0',
        result: '0x4355c47d63924e8a72e509b65029052eb6c299d53a04e167c5775fd466751c9d07299936d304c153f6443dfa05f40ff007d72911b6f72307f996231605b915621c',
      },
    });
  });
});
