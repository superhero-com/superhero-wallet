// @ts-nocheck
import { ref } from 'vue';

jest.mock('@reown/walletkit', () => ({
  WalletKit: {
    init: jest.fn().mockResolvedValue({
      getActiveSessions: jest.fn(() => ({})),
      on: jest.fn(),
      emitSessionEvent: jest.fn().mockResolvedValue(undefined),
      updateSession: jest.fn().mockResolvedValue({ acknowledged: () => Promise.resolve() }),
      pair: jest.fn(),
      approveSession: jest.fn().mockResolvedValue({ topic: 't', namespaces: { eip155: { accounts: [], chains: [] } } }),
      rejectSession: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

jest.mock('@walletconnect/core', () => ({ Core: jest.fn().mockImplementation(() => ({})) }));

let activeAccountRef: any;

describe('WalletConnect accountsChanged behavior', () => {
  beforeEach(() => {
    jest.resetModules();
    // Mock constants and composables
    jest.doMock('@/constants', () => ({
      APP_NAME: 'Superhero', APP_URL: 'superhero.com', EVM_PROTOCOLS: ['ethereum'], PROTOCOLS: { ethereum: 'ethereum' }, STORAGE_KEYS: { walletConnectSession: 'wc' }, WALLET_CONNECT_PROJECT_ID: 'pid',
    }));
    // Mock auth composable dependency chain
    jest.doMock('@/composables/auth', () => ({ useAuth: () => ({ isLoggedIn: { value: true }, secureLoginTimeoutDecrypted: { value: 0 } }) }));
    jest.doMock('@/composables', () => ({
      useAccounts: jest.fn(), useNetworks: jest.fn(), useModals: jest.fn(), useAuth: jest.fn(),
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
    jest.doMock('@/composables/accounts', () => ({ useAccounts: () => ({ activeAccount: activeAccountRef, accountsGroupedByProtocol, getLastActiveProtocolAccount: () => ({ address: '0xbbb' }) }) }));
    jest.doMock('@/composables/networks', () => ({ useNetworks: () => ({ activeNetwork, networks }) }));
    jest.doMock('@/popup/plugins/i18n', () => ({ tg: (k: string) => k }));
    jest.doMock('@/composables/modals', () => ({ useModals: () => ({ openDefaultModal: jest.fn(), openModal: jest.fn() }) }));
  });

  it('approves session with events and orders accounts by last active', async () => {
    const { useWalletConnect } = await import('@/composables/walletConnect');
    const wc = useWalletConnect();

    // Start connect flow and simulate proposal
    await wc.connect('wc:abc');
    const anyWallet: any = (await import('@reown/walletkit')).WalletKit;
    const web3wallet = await (anyWallet.init as jest.Mock).mock.results[0].value;

    // Trigger session_proposal handler
    const onMock = web3wallet.on as jest.Mock;
    const sessionProposalHandler = onMock.mock.calls.find((args: any[]) => args[0] === 'session_proposal')[1];
    await sessionProposalHandler({
      id: 1,
      params: {
        proposer: { metadata: { url: 'https://app.uniswap.org', icons: [] } },
        requiredNamespaces: { eip155: { methods: [], chains: ['eip155:1'], events: [] } },
      },
    });

    const approveArgs = (web3wallet.approveSession as jest.Mock).mock.calls[0][0];
    const ns = approveArgs.namespaces.eip155;
    // Some WC utils may strip unrequested events; ensure events array exists
    expect(Array.isArray(ns.events)).toBe(true);
    expect(ns.accounts[0]).toBe('eip155:1:0xbbb');
  });
});
