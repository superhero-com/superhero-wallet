// @ts-nocheck
import { ref } from 'vue';

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
    }),
  },
}));

// `Core` is instantiated with `new`; Vitest 4 requires a constructable
// implementation (an arrow function is not a constructor).
vi.mock('@walletconnect/core', () => ({ Core: vi.fn(class Core {}) }));

let activeAccountRef: any;

describe('WalletConnect accountsChanged behavior', () => {
  beforeEach(async () => {
    vi.resetModules();
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
    vi.doMock('@/composables/modals', () => ({ useModals: () => ({ openDefaultModal: vi.fn(), openModal: vi.fn() }) }));
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
  // The lazily-imported WalletConnect stack pushes this well past the 5s default
  // when the whole suite runs together (it passes in ~1.5s in isolation), so give
  // it headroom rather than letting a slow import flake the run.
  }, 15000);
});
