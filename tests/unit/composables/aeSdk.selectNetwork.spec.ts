import { computed, ref } from 'vue';
import { JSDOM } from 'jsdom';
import {
  AeSdkAepp,
  BrowserWindowMessageConnection,
  MESSAGE_DIRECTION,
  METHODS,
  Node,
  RpcInternalError,
  RpcNoNetworkById,
  RpcNotAuthorizeError,
  RpcRejectedByUserError,
  SUBSCRIPTION_TYPES,
  Tag,
  buildTx,
} from '@aeternity/aepp-sdk';

import type { INetwork } from '@/types';
import { NETWORK_NAME_MAX_LENGTH, NETWORK_TYPE_CUSTOM, PROTOCOLS } from '@/constants';
import { NODE_STATUS_TIMEOUT } from '@/protocols/aeternity/helpers/selectAeppNetwork';

const DAPP_URL = 'https://dapp.example/';
const MAINNET_URL = 'https://mainnet.example';
const TESTNET_URL = 'https://testnet.example';
const HYPERCHAIN_URL = 'https://hyperchain.example';
const NEW_NODE_URL = 'https://new-hyperchain.example';
const AE_ACCOUNT = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';

function createNetwork(name: string, nodeUrl: string): INetwork {
  return {
    name,
    type: NETWORK_TYPE_CUSTOM,
    protocols: {
      aeternity: {
        nodeUrl, middlewareUrl: `${nodeUrl}/mdw`, backendUrl: `${nodeUrl}/tips`, explorerUrl: `${nodeUrl}/explorer`,
      },
      ethereum: { nodeUrl: 'https://ethereum.example', chainId: '1' },
    } as INetwork['protocols'],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => { resolve = res; });
  return { promise, resolve };
}

function createNetworkState() {
  const networks = ref<Record<string, INetwork>>({
    Mainnet: createNetwork('Mainnet', MAINNET_URL),
    Testnet: createNetwork('Testnet', TESTNET_URL),
    Hyperchain: createNetwork('Hyperchain', HYPERCHAIN_URL),
    Offline: createNetwork('Offline', 'https://offline.example'),
  });
  const activeNetworkName = ref('Mainnet');
  const activeNetwork = computed(() => networks.value[activeNetworkName.value]);
  const callbacks: ((network: INetwork, oldNetwork: INetwork) => unknown)[] = [];
  return {
    networks,
    activeNetworkName,
    activeNetwork,
    areNetworksRestored: ref(true),
    onNetworkChange: (callback: typeof callbacks[number]) => callbacks.push(callback),
    switchNetwork: vi.fn((name: string) => {
      const oldNetwork = activeNetwork.value;
      activeNetworkName.value = name;
      callbacks.forEach((callback) => callback(activeNetwork.value, oldNetwork));
    }),
    addCustomNetwork: vi.fn((network: INetwork) => {
      networks.value[network.name] = network;
    }),
    removeCustomNetwork: vi.fn((name: string) => {
      if (name === activeNetworkName.value) activeNetworkName.value = 'Mainnet';
      delete networks.value[name];
      return true;
    }),
  };
}

describe('aepp network selection', () => {
  let networkState: ReturnType<typeof createNetworkState>;
  let askPermission: ReturnType<typeof vi.fn>;
  let checkOrAskPermission: ReturnType<typeof vi.fn>;
  let getPermissionForUrl: ReturnType<typeof vi.fn>;
  let aeAccount: { address: string } | undefined;
  let statusByUrl: Record<string, string>;
  let pages: JSDOM[];

  beforeEach(() => {
    vi.resetModules();
    networkState = createNetworkState();
    askPermission = vi.fn().mockResolvedValue(true);
    checkOrAskPermission = vi.fn();
    // A site the user connected on an earlier visit
    getPermissionForUrl = vi.fn(() => ({ host: 'dapp.example' }));
    aeAccount = undefined;
    pages = [];
    statusByUrl = {
      [MAINNET_URL]: 'ae_mainnet',
      [TESTNET_URL]: 'ae_uat',
      [HYPERCHAIN_URL]: 'ae_hyperchain',
      [NEW_NODE_URL]: 'ae_new_hyperchain',
    };
    vi.spyOn(Node.prototype, 'getStatus').mockImplementation(async function getStatus(this: Node) {
      const networkId = statusByUrl[this.$host.replace(/\/$/, '')];
      if (!networkId) throw new Error('Node is offline');
      return { networkId, nodeVersion: '7.3.0' } as Awaited<ReturnType<Node['getStatus']>>;
    });
    vi.doMock('@/lib/FramesConnection', () => ({ FramesConnection: { initialized: true } }));
    vi.doMock('@/composables/networks', () => ({ useNetworks: () => networkState }));
    vi.doMock('@/protocols/aeternity/composables', () => ({
      useAeNetworkSettings: () => ({
        aeActiveNetworkSettings: computed(
          () => networkState.activeNetwork.value.protocols.aeternity,
        ),
      }),
    }));
    vi.doMock('@/composables/accounts', () => ({
      useAccounts: () => ({
        aeAccounts: ref(aeAccount ? [aeAccount] : []),
        getLastActiveProtocolAccount: () => aeAccount,
        onAccountChange: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/permissions', () => ({
      usePermissions: () => ({ askPermission, checkOrAskPermission, getPermissionForUrl }),
    }));
  });

  afterEach(() => {
    pages.forEach((page) => page.window.close());
    vi.doUnmock('@/lib/FramesConnection');
    vi.doUnmock('@/composables/networks');
    vi.doUnmock('@/protocols/aeternity/composables');
    vi.doUnmock('@/composables/accounts');
    vi.doUnmock('@/composables/permissions');
    vi.restoreAllMocks();
  });

  async function connectAepp() {
    const { useAeSdk } = await import('@/composables/aeSdk');
    const composable = useAeSdk();
    const walletSdk = await composable.getAeSdk();
    const page = new JSDOM('', { url: DAPP_URL });
    pages.push(page);
    const { window } = page;
    // jsdom does not populate the origin/source fields of postMessage events.
    window.postMessage = (data: unknown) => {
      setTimeout(() => window.dispatchEvent(new window.MessageEvent('message', {
        data,
        origin: window.location.origin,
        source: window,
      })));
    };
    const pageWindow = window as unknown as Window;
    walletSdk.addRpcClient(new BrowserWindowMessageConnection({
      self: pageWindow,
      target: pageWindow,
      sendDirection: MESSAGE_DIRECTION.to_aepp,
      receiveDirection: MESSAGE_DIRECTION.to_waellet,
    }));
    const onNetworkChange = vi.fn();
    const aepp = new AeSdkAepp({ name: 'Test aepp', onNetworkChange });
    await aepp.connectToWallet(new BrowserWindowMessageConnection({
      self: pageWindow,
      target: pageWindow,
      sendDirection: MESSAGE_DIRECTION.to_waellet,
      receiveDirection: MESSAGE_DIRECTION.to_aepp,
    }));
    onNetworkChange.mockClear();
    return {
      aepp, walletSdk, composable, onNetworkChange,
    };
  }

  /** The status request of a switch to Testnet answers once `nodeReady` resolves */
  function holdSwitchToTestnet() {
    const nodeReady = deferred<Awaited<ReturnType<Node['getStatus']>>>();
    const getStatus = vi.mocked(Node.prototype.getStatus).getMockImplementation()!;
    const target = { statusRequests: 0 };
    vi.mocked(Node.prototype.getStatus).mockImplementation(function waitForNode(this: Node) {
      if (this.$host === TESTNET_URL) {
        target.statusRequests += 1;
        // Testnet is known by its id, so the first request is the one of the switch
        if (target.statusRequests === 1) return nodeReady.promise;
      }
      return getStatus.call(this);
    });
    return { nodeReady, target };
  }

  it('changes the node and notifies the aepp only after approval', async () => {
    const approval = deferred<boolean>();
    askPermission.mockReturnValue(approval.promise);
    const {
      aepp, walletSdk, composable, onNetworkChange,
    } = await connectAepp();
    const selecting = aepp.askToSelectNetwork({ networkId: 'ae_uat' });

    await vi.waitFor(() => expect(askPermission).toHaveBeenCalledOnce());
    expect(networkState.activeNetworkName.value).toBe('Mainnet');
    expect(walletSdk.api.$host).toBe(MAINNET_URL);
    expect(onNetworkChange).not.toHaveBeenCalled();
    expect(askPermission).toHaveBeenCalledWith(METHODS.updateNetwork, 'https://dapp.example', expect.objectContaining({
      protocol: PROTOCOLS.aeternity,
      networkName: 'Testnet',
      nodeUrl: TESTNET_URL,
      networkId: 'ae_uat',
      isNewNetwork: false,
    }));

    approval.resolve(true);
    await selecting;
    expect(networkState.activeNetworkName.value).toBe('Testnet');
    expect(walletSdk.api.$host).toBe(TESTNET_URL);
    expect(composable.nodeNetworkId.value).toBe('ae_uat');
    expect(onNetworkChange).toHaveBeenCalledWith(expect.objectContaining({ networkId: 'ae_uat' }));
  });

  it('asks about concurrent requests one at a time and continues after a denial', async () => {
    const firstApproval = deferred<boolean>();
    const secondApproval = deferred<boolean>();
    askPermission.mockReturnValueOnce(firstApproval.promise)
      .mockReturnValueOnce(secondApproval.promise);
    const { aepp, walletSdk, onNetworkChange } = await connectAepp();
    let deliveredRequests = 0;
    pages[0].window.addEventListener('message', ({ data }) => {
      if (
        data.type === MESSAGE_DIRECTION.to_waellet
        && data.data?.method === METHODS.updateNetwork
        && data.data.id != null
      ) deliveredRequests += 1;
    });
    const first = aepp.askToSelectNetwork({ networkId: 'ae_uat' });
    const firstRejected = expect(first).rejects.toBeInstanceOf(RpcRejectedByUserError);
    const second = aepp.askToSelectNetwork({ networkId: 'ae_hyperchain' });

    await vi.waitFor(() => {
      expect(deliveredRequests).toBe(2);
      expect(askPermission).toHaveBeenCalledOnce();
    });
    expect(networkState.switchNetwork).not.toHaveBeenCalled();

    firstApproval.resolve(false);
    await firstRejected;
    await vi.waitFor(() => expect(askPermission).toHaveBeenCalledTimes(2));
    expect(askPermission).toHaveBeenNthCalledWith(2, METHODS.updateNetwork, 'https://dapp.example', expect.objectContaining({
      networkName: 'Hyperchain',
    }));
    expect(walletSdk.api.$host).toBe(MAINNET_URL);

    secondApproval.resolve(true);
    await second;
    expect(networkState.switchNetwork).toHaveBeenCalledExactlyOnceWith('Hyperchain');
    expect(walletSdk.api.$host).toBe(HYPERCHAIN_URL);
    expect(onNetworkChange).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      networkId: 'ae_hyperchain',
    }));
  });

  it('finds a saved hyperchain by its node-reported network ID despite another node being offline', async () => {
    const { aepp, walletSdk } = await connectAepp();

    await aepp.askToSelectNetwork({ networkId: 'ae_hyperchain' });

    expect(networkState.activeNetworkName.value).toBe('Hyperchain');
    expect(walletSdk.api.$host).toBe(HYPERCHAIN_URL);
    expect(networkState.addCustomNetwork).not.toHaveBeenCalled();
  });

  it('finds a saved hyperchain by its node-reported network ID before a hanging node times out', async () => {
    const { aepp, walletSdk } = await connectAepp();
    const getStatus = vi.mocked(Node.prototype.getStatus).getMockImplementation()!;
    vi.mocked(Node.prototype.getStatus).mockImplementation(function hang(this: Node, ...args) {
      return this.$host.replace(/\/$/, '') === 'https://offline.example'
        ? new Promise(() => {})
        : getStatus.apply(this, args);
    });
    const startedAt = Date.now();

    await aepp.askToSelectNetwork({ networkId: 'ae_hyperchain' });

    expect(Date.now() - startedAt).toBeLessThan(NODE_STATUS_TIMEOUT);
    expect(walletSdk.api.$host).toBe(HYPERCHAIN_URL);
  });

  it('keeps the request pending until the selected node is ready', async () => {
    const { aepp, walletSdk, onNetworkChange } = await connectAepp();
    const { nodeReady, target } = holdSwitchToTestnet();
    let answered = false;
    const selecting = aepp.askToSelectNetwork({ networkId: 'ae_uat' }).then(() => {
      answered = true;
    });

    await vi.waitFor(() => expect(target.statusRequests).toBe(1));
    expect(networkState.activeNetworkName.value).toBe('Testnet');
    expect(answered).toBe(false);
    expect(walletSdk.api.$host).toBe(MAINNET_URL);
    expect(onNetworkChange).not.toHaveBeenCalled();

    nodeReady.resolve({ networkId: 'ae_uat', nodeVersion: '7.3.0' } as Awaited<ReturnType<Node['getStatus']>>);
    await selecting;
    expect(walletSdk.api.$host).toBe(TESTNET_URL);
    expect(onNetworkChange).toHaveBeenCalledWith(expect.objectContaining({ networkId: 'ae_uat' }));
  });

  it('asks to sign for the network a dapp switched to only once its node answered', async () => {
    aeAccount = { address: AE_ACCOUNT };
    const { aepp, composable } = await connectAepp();
    const promptedFor: (string | undefined)[] = [];
    checkOrAskPermission.mockImplementation(async (method: string) => {
      if (method !== METHODS.sign) return true;
      promptedFor.push(composable.nodeNetworkId.value);
      return false;
    });
    await aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'connected');
    const { nodeReady, target } = holdSwitchToTestnet();
    const selecting = aepp.askToSelectNetwork({ networkId: 'ae_uat' });
    await vi.waitFor(() => expect(target.statusRequests).toBe(1));

    const signRequested = new Promise<void>((resolve) => {
      pages[0].window.addEventListener('message', ({ data }) => {
        if (data.type === MESSAGE_DIRECTION.to_waellet && data.data?.method === METHODS.sign) {
          resolve();
        }
      });
    });
    const signing = aepp._resolveAccount().signTransaction(buildTx({
      tag: Tag.SpendTx,
      senderId: AE_ACCOUNT,
      recipientId: AE_ACCOUNT,
      amount: 1,
      fee: 20000000000000,
      nonce: 1,
    }), { networkId: 'ae_uat' });
    await signRequested;
    // Time enough for a wallet that doesn't wait to ask
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    nodeReady.resolve({ networkId: 'ae_uat', nodeVersion: '7.3.0' } as Awaited<ReturnType<Node['getStatus']>>);

    await expect(signing).rejects.toBeInstanceOf(RpcRejectedByUserError);
    expect(promptedFor).toEqual(['ae_uat']);
    await selecting;
  });

  it('reuses a saved node URL with a trailing slash', async () => {
    const { aepp, walletSdk } = await connectAepp();

    await aepp.askToSelectNetwork({ nodeUrl: `${HYPERCHAIN_URL}/` });

    expect(networkState.activeNetworkName.value).toBe('Hyperchain');
    expect(walletSdk.api.$host).toBe(HYPERCHAIN_URL);
    expect(networkState.addCustomNetwork).not.toHaveBeenCalled();
  });

  it.each([{ networkId: 'ae_mainnet' }, { nodeUrl: MAINNET_URL }])('keeps the active network without confirmation for %j', async (selector) => {
    const { aepp, walletSdk, onNetworkChange } = await connectAepp();

    await aepp.askToSelectNetwork(selector);

    expect(networkState.switchNetwork).not.toHaveBeenCalled();
    expect(askPermission).not.toHaveBeenCalled();
    expect(walletSdk.api.$host).toBe(MAINNET_URL);
    expect(onNetworkChange).not.toHaveBeenCalled();
  });

  it('rejects an unknown network ID without changing or creating networks', async () => {
    const { aepp, walletSdk } = await connectAepp();

    await expect(aepp.askToSelectNetwork({ networkId: 'ae_unknown' })).rejects.toBeInstanceOf(RpcNoNetworkById);

    expect(askPermission).not.toHaveBeenCalled();
    expect(networkState.switchNetwork).not.toHaveBeenCalled();
    expect(networkState.addCustomNetwork).not.toHaveBeenCalled();
    expect(walletSdk.api.$host).toBe(MAINNET_URL);
  });

  it.each([{ networkId: 'ae_uat' }, { nodeUrl: NEW_NODE_URL }])('rejects a denied request for %j without persisting changes', async (selector) => {
    askPermission.mockResolvedValue(false);
    const { aepp, walletSdk } = await connectAepp();

    await expect(aepp.askToSelectNetwork(selector)).rejects.toBeInstanceOf(RpcRejectedByUserError);

    expect(networkState.switchNetwork).not.toHaveBeenCalled();
    expect(networkState.addCustomNetwork).not.toHaveBeenCalled();
    expect(walletSdk.api.$host).toBe(MAINNET_URL);
  });

  it('creates an approved custom node without inheriting unrelated aeternity services', async () => {
    const { aepp, walletSdk } = await connectAepp();
    const otherProtocolSettings = networkState.activeNetwork.value.protocols.ethereum;

    await aepp.askToSelectNetwork({ nodeUrl: NEW_NODE_URL });

    expect(askPermission).toHaveBeenCalledWith(METHODS.updateNetwork, 'https://dapp.example', expect.objectContaining({
      nodeUrl: NEW_NODE_URL,
      networkId: 'ae_new_hyperchain',
      isNewNetwork: true,
    }));
    expect(networkState.addCustomNetwork).toHaveBeenCalledOnce();
    expect(networkState.activeNetwork.value).toMatchObject({
      type: NETWORK_TYPE_CUSTOM,
      protocols: {
        aeternity: {
          nodeUrl: NEW_NODE_URL, middlewareUrl: '', backendUrl: '', explorerUrl: '',
        },
        ethereum: otherProtocolSettings,
      },
    });
    expect(walletSdk.api.$host).toBe(NEW_NODE_URL);
  });

  it('copies other protocol settings so editing the custom network preserves the original', async () => {
    const { aepp } = await connectAepp();
    const originalNetwork = networkState.activeNetwork.value;
    const originalSettings = { ...originalNetwork.protocols.ethereum };

    await aepp.askToSelectNetwork({ nodeUrl: NEW_NODE_URL });

    const customSettings = networkState.activeNetwork.value.protocols.ethereum;
    expect(customSettings).toEqual(originalSettings);
    expect(customSettings).not.toBe(originalNetwork.protocols.ethereum);
    customSettings.nodeUrl = 'https://custom-ethereum.example';
    customSettings.chainId = '123';

    expect(originalNetwork.protocols.ethereum).toEqual(originalSettings);
  });

  it('preserves an existing network whose name matches the new network ID', async () => {
    const existing = createNetwork('ae_new_hyperchain'.slice(0, NETWORK_NAME_MAX_LENGTH), HYPERCHAIN_URL);
    networkState.networks.value[existing.name] = existing;
    const { aepp } = await connectAepp();

    await aepp.askToSelectNetwork({ nodeUrl: NEW_NODE_URL });

    expect(networkState.networks.value[existing.name]).toEqual(existing);
    expect(networkState.activeNetworkName.value).not.toBe(existing.name);
    expect(networkState.activeNetwork.value.protocols.aeternity.nodeUrl).toBe(NEW_NODE_URL);
  });

  it.each(['deleted', 'edited'])('rejects a saved target %s while approval is open', async (change) => {
    const approval = deferred<boolean>();
    askPermission.mockReturnValue(approval.promise);
    const { aepp, walletSdk } = await connectAepp();
    const selecting = aepp.askToSelectNetwork({ nodeUrl: TESTNET_URL });
    const rejected = expect(selecting).rejects.toBeInstanceOf(RpcNoNetworkById);
    await vi.waitFor(() => expect(askPermission).toHaveBeenCalledOnce());
    if (change === 'deleted') delete networkState.networks.value.Testnet;
    else networkState.networks.value.Testnet.protocols.aeternity.nodeUrl = NEW_NODE_URL;

    approval.resolve(true);
    await rejected;

    expect(networkState.switchNetwork).not.toHaveBeenCalled();
    expect(walletSdk.api.$host).toBe(MAINNET_URL);
  });

  it.each([
    null,
    {},
    { networkId: '' },
    { nodeUrl: '' },
    { nodeUrl: 'file:///node' },
    { nodeUrl: 'ftp://node.example' },
    { nodeUrl: 'https://user:password@node.example' },
    { nodeUrl: 'not a URL' },
    { networkId: 'ae_uat', nodeUrl: TESTNET_URL },
    { nodeUrl: 'https://unreachable.example' },
  ])('rejects an invalid or unreachable target %j without changes', async (selector) => {
    const { aepp, walletSdk } = await connectAepp();

    await expect(aepp.askToSelectNetwork(
      selector as Parameters<AeSdkAepp['askToSelectNetwork']>[0],
    )).rejects.toBeInstanceOf(RpcInternalError);

    expect(askPermission).not.toHaveBeenCalled();
    expect(networkState.switchNetwork).not.toHaveBeenCalled();
    expect(networkState.addCustomNetwork).not.toHaveBeenCalled();
    expect(walletSdk.api.$host).toBe(MAINNET_URL);
  });

  it('refuses a page the user never connected, before asking any node', async () => {
    getPermissionForUrl.mockReturnValue(undefined);
    const { aepp, walletSdk } = await connectAepp();
    vi.mocked(Node.prototype.getStatus).mockClear();

    await expect(aepp.askToSelectNetwork({ nodeUrl: NEW_NODE_URL }))
      .rejects.toBeInstanceOf(RpcNotAuthorizeError);

    expect(Node.prototype.getStatus).not.toHaveBeenCalled();
    expect(askPermission).not.toHaveBeenCalled();
    expect(walletSdk.api.$host).toBe(MAINNET_URL);
  });

  it('lets a dapp switch once it was given the accounts in this connection', async () => {
    getPermissionForUrl.mockReturnValue(undefined);
    checkOrAskPermission.mockResolvedValue(true);
    aeAccount = { address: AE_ACCOUNT };
    const { aepp, walletSdk } = await connectAepp();

    await aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'connected');
    await aepp.askToSelectNetwork({ networkId: 'ae_hyperchain' });

    expect(networkState.activeNetworkName.value).toBe('Hyperchain');
    expect(walletSdk.api.$host).toBe(HYPERCHAIN_URL);
  });

  it('drops a queued request of a dapp that disconnected meanwhile', async () => {
    const approval = deferred<boolean>();
    askPermission.mockReturnValueOnce(approval.promise);
    const first = await connectAepp();
    const second = await connectAepp();
    let isSecondDelivered = false;
    pages[1].window.addEventListener('message', ({ data }) => {
      if (
        data.type === MESSAGE_DIRECTION.to_waellet
        && data.data?.method === METHODS.updateNetwork
        && data.data.id != null
      ) isSecondDelivered = true;
    });
    const selecting = first.aepp.askToSelectNetwork({ networkId: 'ae_uat' });
    await vi.waitFor(() => expect(askPermission).toHaveBeenCalledOnce());
    second.aepp.askToSelectNetwork({ networkId: 'ae_hyperchain' }).catch(() => {});
    await vi.waitFor(() => expect(isSecondDelivered).toBe(true));
    second.aepp.disconnectWallet();
    // Closing the connection removes the client
    await vi.waitFor(() => expect(second.walletSdk._clients.size).toBe(1));

    approval.resolve(true);
    await selecting;
    // Queued after the dropped one
    await first.aepp.askToSelectNetwork({ networkId: 'ae_mainnet' });

    expect(askPermission.mock.calls.map(([, , props]) => props.networkName))
      .toEqual(['Testnet', 'Mainnet']);
    expect(networkState.activeNetworkName.value).toBe('Mainnet');
  });

  it('answers a request whose node never responds and serves the next one', async () => {
    const { aepp } = await connectAepp();
    const getStatus = vi.mocked(Node.prototype.getStatus).getMockImplementation()!;
    vi.mocked(Node.prototype.getStatus).mockImplementation(function hang(this: Node) {
      if (this.$host.startsWith('https://hanging.example')) return new Promise(() => {});
      return getStatus.call(this);
    });

    vi.useFakeTimers();
    try {
      const rejected = expect(aepp.askToSelectNetwork({ nodeUrl: 'https://hanging.example' }))
        .rejects.toBeInstanceOf(RpcInternalError);
      await vi.advanceTimersByTimeAsync(5100);
      await rejected;
    } finally {
      vi.useRealTimers();
    }
    await aepp.askToSelectNetwork({ networkId: 'ae_hyperchain' });

    expect(askPermission).toHaveBeenCalledOnce();
    expect(networkState.activeNetworkName.value).toBe('Hyperchain');
  });

  it('switches back and removes a new network whose node reports another id once used', async () => {
    const { aepp, walletSdk } = await connectAepp();
    const getStatus = vi.mocked(Node.prototype.getStatus).getMockImplementation()!;
    let newNodeRequests = 0;
    vi.mocked(Node.prototype.getStatus).mockImplementation(function lie(this: Node) {
      if (this.$host.replace(/\/$/, '') === NEW_NODE_URL) {
        newNodeRequests += 1;
        // A test network to the prompt, mainnet once the wallet signs with it
        const networkId = newNodeRequests === 1 ? 'ae_uat' : 'ae_mainnet';
        return Promise.resolve({ networkId, nodeVersion: '7.3.0' } as Awaited<ReturnType<Node['getStatus']>>);
      }
      return getStatus.call(this);
    });

    await expect(aepp.askToSelectNetwork({ nodeUrl: NEW_NODE_URL }))
      .rejects.toBeInstanceOf(RpcInternalError);

    expect(askPermission).toHaveBeenCalledWith(METHODS.updateNetwork, 'https://dapp.example', expect.objectContaining({
      networkId: 'ae_uat',
      isNewNetwork: true,
    }));
    expect(networkState.addCustomNetwork).toHaveBeenCalledOnce();
    expect(networkState.activeNetworkName.value).toBe('Mainnet');
    expect(Object.values(networkState.networks.value)
      .map(({ protocols }) => protocols.aeternity.nodeUrl)).not.toContain(NEW_NODE_URL);
    expect(walletSdk.api.$host).toBe(MAINNET_URL);
  });

  it('switches back but keeps a saved network whose node reports another id once used', async () => {
    const { aepp, walletSdk } = await connectAepp();
    const getStatus = vi.mocked(Node.prototype.getStatus).getMockImplementation()!;
    let hyperchainRequests = 0;
    vi.mocked(Node.prototype.getStatus).mockImplementation(function changeId(this: Node) {
      if (this.$host === HYPERCHAIN_URL) {
        hyperchainRequests += 1;
        if (hyperchainRequests > 1) {
          return Promise.resolve({ networkId: 'ae_other', nodeVersion: '7.3.0' } as Awaited<ReturnType<Node['getStatus']>>);
        }
      }
      return getStatus.call(this);
    });

    await expect(aepp.askToSelectNetwork({ networkId: 'ae_hyperchain' }))
      .rejects.toBeInstanceOf(RpcInternalError);

    expect(networkState.switchNetwork).toHaveBeenCalledWith('Hyperchain');
    expect(networkState.activeNetworkName.value).toBe('Mainnet');
    expect(networkState.networks.value.Hyperchain).toBeDefined();
    expect(networkState.removeCustomNetwork).not.toHaveBeenCalled();
    expect(walletSdk.api.$host).toBe(MAINNET_URL);
  });

  it('keeps a network the user switched to while the approved one was being selected', async () => {
    const { aepp, walletSdk } = await connectAepp();
    const nodeReady = deferred<Awaited<ReturnType<Node['getStatus']>>>();
    const getStatus = vi.mocked(Node.prototype.getStatus).getMockImplementation()!;
    let isTestnetHeld = false;
    vi.mocked(Node.prototype.getStatus).mockImplementation(function hold(this: Node) {
      if (this.$host === TESTNET_URL && !isTestnetHeld) {
        isTestnetHeld = true;
        return nodeReady.promise;
      }
      return getStatus.call(this);
    });
    const rejected = expect(aepp.askToSelectNetwork({ networkId: 'ae_uat' }))
      .rejects.toBeInstanceOf(RpcInternalError);
    await vi.waitFor(() => expect(isTestnetHeld).toBe(true));

    networkState.switchNetwork('Hyperchain');
    await rejected;
    nodeReady.resolve({ networkId: 'ae_uat', nodeVersion: '7.3.0' } as Awaited<ReturnType<Node['getStatus']>>);

    expect(networkState.activeNetworkName.value).toBe('Hyperchain');
    expect(walletSdk.api.$host).toBe(HYPERCHAIN_URL);
  });

  it.each([
    ['an invisible character', 'Mainnet​'],
    ['more than 64 characters', 'a'.repeat(65)],
  ])('refuses a new node whose network id has %s', async (_, networkId) => {
    statusByUrl[NEW_NODE_URL] = networkId;
    const { aepp } = await connectAepp();

    await expect(aepp.askToSelectNetwork({ nodeUrl: NEW_NODE_URL }))
      .rejects.toBeInstanceOf(RpcInternalError);

    expect(askPermission).not.toHaveBeenCalled();
    expect(networkState.addCustomNetwork).not.toHaveBeenCalled();
  });

  it('refuses a node URL the network form refuses, such as an IP address', async () => {
    statusByUrl['http://192.168.0.1:3013'] = 'ae_local';
    const { aepp } = await connectAepp();
    vi.mocked(Node.prototype.getStatus).mockClear();

    await expect(aepp.askToSelectNetwork({ nodeUrl: 'http://192.168.0.1:3013' }))
      .rejects.toBeInstanceOf(RpcInternalError);

    expect(Node.prototype.getStatus).not.toHaveBeenCalled();
    expect(askPermission).not.toHaveBeenCalled();
  });

  it('takes the default network of a known id without asking the saved nodes', async () => {
    networkState.activeNetworkName.value = 'Testnet';
    networkState.networks.value['My mainnet'] = createNetwork('My mainnet', 'https://my-mainnet.example');
    statusByUrl['https://my-mainnet.example'] = 'ae_mainnet';
    const { aepp } = await connectAepp();
    vi.mocked(Node.prototype.getStatus).mockClear();

    await aepp.askToSelectNetwork({ networkId: 'ae_mainnet' });

    expect(askPermission).toHaveBeenCalledWith(METHODS.updateNetwork, 'https://dapp.example', expect.objectContaining({
      networkName: 'Mainnet',
      nodeUrl: MAINNET_URL,
    }));
    expect(networkState.activeNetworkName.value).toBe('Mainnet');
    expect(vi.mocked(Node.prototype.getStatus).mock.contexts
      .map((node) => node.$host.replace(/\/$/, ''))).not.toContain('https://my-mainnet.example');
  });
});
