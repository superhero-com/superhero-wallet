// @ts-nocheck
/**
 * Drives `useInAppBrowser` like the native plugin would. Every page load gets its own
 * JSDOM document and the real injected provider; a real aepp SDK talks to a real wallet SDK
 * through it. Only the wallet's composables and the EVM handler are faked.
 */
import { ref } from 'vue';
import { JSDOM } from 'jsdom';
import {
  AccountMemory,
  AeSdkAepp,
  AeSdkWallet,
  BrowserWindowMessageConnection,
  MESSAGE_DIRECTION,
  Node,
  SUBSCRIPTION_TYPES,
  WALLET_TYPE,
  walletDetector,
} from '@aeternity/aepp-sdk';

const DAPP_URL = 'https://dapp.example/swap';
const DAPP_ORIGIN = 'https://dapp.example';
const EVIL_URL = 'https://evil.example/';
const EVM_ADDRESS = '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4';

const activeAccount = ref({ globalIdx: 0 });
const activeNetwork = ref({ name: 'Mainnet' });
const permissions = ref({});
const modalsOpen = ref([]);
const isAuthenticated = ref(true);
const wcSession = ref(null);
const connectWalletConnect = vi.fn();
const handleEvmRpcMethod = vi.fn();
const handleEvmRpcRequest = vi.fn();
const getAeSdk = vi.fn();
const evmState = { accounts: [], chainId: '0x1' };
let walletSdk;

vi.mock('@/composables/aeSdk', () => ({ useAeSdk: () => ({ getAeSdk }) }));
vi.mock('@/composables/accounts', () => ({ useAccounts: () => ({ activeAccount }) }));
vi.mock('@/composables/auth', () => ({ useAuth: () => ({ isAuthenticated }) }));
vi.mock('@/composables/modals', () => ({ useModals: () => ({ modalsOpen }) }));
vi.mock('@/composables/networks', () => ({ useNetworks: () => ({ activeNetwork }) }));
vi.mock('@/composables/permissions', () => ({ usePermissions: () => ({ permissions }) }));
vi.mock('@/composables/walletConnect', () => ({
  useWalletConnect: () => ({ connect: connectWalletConnect, wcSession }),
}));
vi.mock('@/protocols/evm/libs/EvmRpcMethodsHandler', () => ({
  handleEvmRpcMethod,
  handleEvmRpcRequest,
}));

const { useInAppBrowser } = await import('@/composables/inAppBrowser');

let listeners: Record<string, Function>;
let browser;
let page;

function createPage(url: string) {
  const { window } = new JSDOM('', { url, runScripts: 'outside-only' });
  // jsdom leaves `origin` and `source` empty; set them as a browser does for a same-window post.
  window.postMessage = (data, targetOrigin) => {
    if (targetOrigin !== '*' && targetOrigin !== window.location.origin) return;
    setTimeout(() => window.dispatchEvent(new window.MessageEvent('message', {
      data,
      origin: window.location.origin,
      source: window,
    })));
  };
  // The native bridge is reachable from every frame and delivers parsed JSON asynchronously.
  window.cordova_iab = {
    postMessage: (json) => setTimeout(() => listeners.message({ data: JSON.parse(json) })),
  };
  return window;
}

/** Commits a new document and reports it the way the plugin does. */
function navigate(url: string, { loadedUrl = url } = {}) {
  page = createPage(url);
  listeners.loadstop({ url: loadedUrl });
  return page;
}

async function openDapp(url = DAPP_URL) {
  useInAppBrowser().openInAppBrowser(url);
  const currentPage = navigate(url);
  await vi.waitFor(() => expect(currentPage.ethereum).toBeDefined());
  return currentPage;
}

async function connectAepp(dappPage) {
  const aepp = new AeSdkAepp({
    name: 'Test aepp',
    onNetworkChange: vi.fn(),
    onAddressChange: vi.fn(),
    onDisconnect: vi.fn(),
  });
  const wallet = await new Promise((resolve) => {
    const stopScan = walletDetector(
      new BrowserWindowMessageConnection({ self: dappPage }),
      ({ newWallet }) => {
        stopScan();
        resolve(newWallet);
      },
    );
  });
  // Same connection `walletDetector` builds for an extension wallet, bound to the dapp page.
  await aepp.connectToWallet(new BrowserWindowMessageConnection({
    self: dappPage,
    target: dappPage,
    origin: dappPage.origin,
    sendDirection: MESSAGE_DIRECTION.to_waellet,
    receiveDirection: MESSAGE_DIRECTION.to_aepp,
  }));
  return { aepp, wallet };
}

function postFromPage(fromPage, data, source = fromPage) {
  fromPage.dispatchEvent(new fromPage.MessageEvent('message', {
    data,
    origin: fromPage.location.origin,
    source,
  }));
}

/** Lets pending bridge round trips settle so "nothing happened" can be asserted. */
const settle = () => new Promise((resolve) => { setTimeout(resolve, 50); });

describe('useInAppBrowser', () => {
  let walletAccount;
  let walletCallbacks;

  beforeEach(() => {
    vi.clearAllMocks();
    listeners = {};
    browser = {
      addEventListener: vi.fn((type, listener) => { listeners[type] = listener; }),
      executeScript: vi.fn(({ code }) => setTimeout(() => page.eval(code))),
      show: vi.fn(),
      hide: vi.fn(),
      close: vi.fn(() => setTimeout(() => listeners.exit())),
    };
    window.cordova = { InAppBrowser: { open: vi.fn(() => browser) } };

    Object.assign(evmState, { accounts: [], chainId: '0x1' });
    handleEvmRpcMethod.mockImplementation(async (_origin, method) => ({
      eth_accounts: { result: evmState.accounts },
      eth_chainId: { result: evmState.chainId },
    }[method] ?? { result: null }));
    handleEvmRpcRequest.mockResolvedValue({ result: null });

    vi.spyOn(Node.prototype, 'getStatus').mockResolvedValue({ networkId: 'ae_uat' });
    getAeSdk.mockImplementation(async () => walletSdk);
    walletAccount = AccountMemory.generate();
    walletCallbacks = {
      onConnection: vi.fn(),
      onSubscription: vi.fn(),
      onDisconnect: vi.fn(),
      onAskAccounts: vi.fn(),
      onAskToSelectNetwork: vi.fn(),
    };
    walletSdk = new AeSdkWallet({
      id: 'superhero-wallet',
      name: 'Superhero Wallet',
      type: WALLET_TYPE.extension,
      nodes: [{ name: 'test', instance: new Node('https://node.example', { ignoreVersion: true }) }],
      accounts: [walletAccount],
      ...walletCallbacks,
    });
  });

  afterEach(async () => {
    if (listeners.exit) {
      listeners.exit();
    }
    vi.restoreAllMocks();
  });

  it('opens the dapp in the native browser', async () => {
    await openDapp();
    expect(window.cordova.InAppBrowser.open).toHaveBeenCalledWith(DAPP_URL, '_blank', expect.stringContaining('beforeload=get'));
  });

  describe('æternity aepps', () => {
    it('connect and get the wallet address attributed to the page origin', async () => {
      const dappPage = await openDapp();
      const { aepp, wallet } = await connectAepp(dappPage);
      await aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'connected');

      expect(wallet.info.type).toBe('extension');
      expect(aepp.address).toBe(walletAccount.address);
      expect(walletCallbacks.onConnection.mock.calls[0][2]).toBe(DAPP_ORIGIN);
      expect(walletCallbacks.onSubscription.mock.calls[0][2]).toBe(DAPP_ORIGIN);
    });

    it('stay connected when the same document reports `loadstop` again', async () => {
      const dappPage = await openDapp();
      const { aepp } = await connectAepp(dappPage);
      listeners.loadstop({ url: DAPP_URL });
      await settle();

      await aepp.askAddresses();
      expect(walletCallbacks.onAskAccounts.mock.calls[0][2]).toBe(DAPP_ORIGIN);
      expect(walletCallbacks.onConnection).toHaveBeenCalledTimes(1);
    });

    it('connect again after disconnecting, without reloading the page', async () => {
      const dappPage = await openDapp();
      const { aepp } = await connectAepp(dappPage);
      aepp.disconnectWallet();

      const { aepp: nextAepp } = await connectAepp(dappPage);
      await nextAepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'connected');
      expect(nextAepp.address).toBe(walletAccount.address);
      expect(walletCallbacks.onConnection).toHaveBeenCalledTimes(2);
    });

    it('ignore messages posted by a frame of the page', async () => {
      const dappPage = await openDapp();
      const frame = dappPage.document.createElement('iframe');
      dappPage.document.body.appendChild(frame);
      postFromPage(dappPage, {
        type: 'to_waellet',
        data: {
          jsonrpc: '2.0', id: 1, method: 'connection.open', params: { name: 'ad', version: 1 },
        },
      }, frame.contentWindow);
      await settle();

      expect(walletCallbacks.onConnection).not.toHaveBeenCalled();
    });

    it('are not announced to once the browser closed', async () => {
      let resolveSdk;
      getAeSdk.mockReturnValueOnce(new Promise((resolve) => { resolveSdk = resolve; }));
      await openDapp();
      await vi.waitFor(() => expect(getAeSdk).toHaveBeenCalled());
      listeners.exit();
      resolveSdk(walletSdk);
      await settle();

      expect(browser.executeScript).not.toHaveBeenCalledWith({
        code: expect.stringContaining('connection.announcePresence'),
      });
    });

    it('are disconnected when the browser closes', async () => {
      const dappPage = await openDapp();
      await connectAepp(dappPage);
      listeners.exit();

      expect(walletCallbacks.onDisconnect).toHaveBeenCalled();
    });
  });

  describe('EVM dapps', () => {
    it('get requests answered, their params passed on as sent', async () => {
      const dappPage = await openDapp();
      handleEvmRpcRequest.mockResolvedValueOnce({ result: '0xsignature' });

      const signature = await dappPage.ethereum.request({
        method: 'personal_sign',
        params: ['0x68656c6c6f', EVM_ADDRESS],
      });

      expect(signature).toBe('0xsignature');
      expect(handleEvmRpcRequest)
        .toHaveBeenCalledWith(DAPP_ORIGIN, 'personal_sign', ['0x68656c6c6f', EVM_ADDRESS]);
    });

    it('get the wallet error as a rejection', async () => {
      const dappPage = await openDapp();
      handleEvmRpcRequest.mockResolvedValueOnce({ error: { code: 4001, message: 'Rejected' } });

      await expect(dappPage.ethereum.request({ method: 'eth_requestAccounts' }))
        .rejects.toMatchObject({ code: 4001, message: 'Rejected' });
    });

    it('pass read-only calls on as is', async () => {
      const dappPage = await openDapp();
      const params = [{ to: EVM_ADDRESS, data: '0x70a08231' }, 'latest'];
      handleEvmRpcRequest.mockResolvedValueOnce({ result: '0x01' });

      expect(await dappPage.ethereum.request({ method: 'eth_call', params })).toBe('0x01');
      expect(handleEvmRpcRequest).toHaveBeenCalledWith(DAPP_ORIGIN, 'eth_call', params);
    });

    it('find the provider through EIP-6963', async () => {
      const dappPage = await openDapp();
      const announced = new Promise((resolve) => {
        dappPage.addEventListener('eip6963:announceProvider', ({ detail }) => resolve(detail));
      });
      dappPage.dispatchEvent(new dappPage.Event('eip6963:requestProvider'));

      const { info, provider } = await announced;
      expect(info).toMatchObject({ name: 'Superhero Wallet', rdns: 'wallet.superhero.com' });
      expect(provider).toBe(dappPage.ethereum);
    });

    it('get accountsChanged and chainChanged only when they change', async () => {
      const dappPage = await openDapp();
      const accountsChanged = vi.fn();
      const chainChanged = vi.fn();
      dappPage.ethereum.on('accountsChanged', accountsChanged);
      dappPage.ethereum.on('chainChanged', chainChanged);

      // Without the permission `eth_accounts` stays empty, so nothing is announced.
      activeAccount.value = { globalIdx: 1 };
      await settle();
      expect(accountsChanged).not.toHaveBeenCalled();

      evmState.accounts = [EVM_ADDRESS];
      permissions.value = { 'dapp.example': { address: true } };
      await vi.waitFor(() => expect(accountsChanged).toHaveBeenCalledWith([EVM_ADDRESS]));

      evmState.chainId = '0x38';
      activeNetwork.value = { name: 'Testnet' };
      await vi.waitFor(() => expect(chainChanged).toHaveBeenCalledWith('0x38'));
      expect(accountsChanged).toHaveBeenCalledTimes(1);
    });
  });

  describe('origin isolation', () => {
    it('ignores bridge messages without the session token', async () => {
      const dappPage = await openDapp();
      dappPage.cordova_iab.postMessage(JSON.stringify({
        kind: 'request', id: 1, method: 'eth_requestAccounts', token: 'guessed',
      }));
      await settle();

      expect(handleEvmRpcRequest).not.toHaveBeenCalled();
    });

    it('stops serving the previous document after a navigation', async () => {
      const dappPage = await openDapp();
      const evilPage = navigate(EVIL_URL);
      await vi.waitFor(() => expect(evilPage.ethereum).toBeDefined());

      dappPage.ethereum.request({ method: 'eth_requestAccounts' });
      await settle();
      expect(handleEvmRpcRequest).not.toHaveBeenCalled();

      evilPage.ethereum.request({ method: 'eth_requestAccounts' });
      await vi.waitFor(() => expect(handleEvmRpcRequest)
        .toHaveBeenCalledWith('https://evil.example', 'eth_requestAccounts', undefined));
    });

    it('does not hand a reply to the page that replaced the requester', async () => {
      const dappPage = await openDapp();
      let resolveRequest;
      const request = new Promise((resolve) => { resolveRequest = resolve; });
      handleEvmRpcRequest.mockReturnValueOnce(request);
      dappPage.ethereum.request({ method: 'eth_requestAccounts' });
      await vi.waitFor(() => expect(resolveRequest).toBeDefined());

      const evilPage = navigate(EVIL_URL);
      evilPage.postMessage = vi.fn();
      resolveRequest({ result: [EVM_ADDRESS] });
      await settle();

      expect(browser.executeScript)
        .toHaveBeenCalledWith({ code: expect.stringContaining(EVM_ADDRESS) });
      expect(evilPage.postMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({ result: [EVM_ADDRESS] }),
        expect.anything(),
      );
    });

    it('does not install the provider into a document of another origin', async () => {
      useInAppBrowser().openInAppBrowser(DAPP_URL);
      // `loadstop` of the dapp arrives after the page already navigated away.
      const evilPage = navigate(EVIL_URL, { loadedUrl: DAPP_URL });
      await settle();

      expect(browser.executeScript).toHaveBeenCalled();
      expect(evilPage.ethereum).toBeUndefined();
      expect(handleEvmRpcMethod).not.toHaveBeenCalled();
      expect(handleEvmRpcRequest).not.toHaveBeenCalled();
    });
  });

  describe('native browser', () => {
    it('hides while a wallet modal is open', async () => {
      await openDapp();
      modalsOpen.value = [{ name: 'confirm-transaction-sign' }];
      await vi.waitFor(() => expect(browser.hide).toHaveBeenCalled());

      modalsOpen.value = [];
      await vi.waitFor(() => expect(browser.show).toHaveBeenCalled());
    });

    it('closes when the wallet locks', async () => {
      await openDapp();
      isAuthenticated.value = false;
      await vi.waitFor(() => expect(browser.close).toHaveBeenCalled());
      isAuthenticated.value = true;
    });

    it.each([
      ['wc:7f6e@2?relay-protocol=irn&symKey=587d', 'wc:7f6e@2?relay-protocol=irn&symKey=587d'],
      ['superhero://wc?uri=wc%3A7f6e%402%3Fsymkey%3D587d', 'wc:7f6e@2?symkey=587d'],
    ])('pairs WalletConnect link %s with a confirmation', async (url, uri) => {
      await openDapp();
      const load = vi.fn();
      listeners.beforeload({ url }, load);

      expect(connectWalletConnect).toHaveBeenCalledWith(uri, true);
      expect(load).not.toHaveBeenCalled();
    });

    it('loads web pages and drops other schemes', async () => {
      await openDapp();
      const load = vi.fn();
      listeners.beforeload({ url: 'https://dapp.example/pool' }, load);
      listeners.beforeload({ url: 'intent://scan#Intent;end' }, load);

      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith('https://dapp.example/pool');
    });
  });
});
