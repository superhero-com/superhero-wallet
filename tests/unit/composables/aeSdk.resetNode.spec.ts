// @ts-nocheck
import { ref } from 'vue';
import { Node } from '@aeternity/aepp-sdk';

// Real SDK classes; only `Node#getStatus` is stubbed, answered by the tests in any order.
const NETWORKS = {
  A: { name: 'A', protocols: { aeternity: { nodeUrl: 'https://a.example' } } },
  B: { name: 'B', protocols: { aeternity: { nodeUrl: 'https://b.example' } } },
  C: { name: 'C', protocols: { aeternity: { nodeUrl: 'https://c.example' } } },
};

let nodeStatuses;
let activeNetworkName;
let createdSdks;

function nodeStatus(url) {
  if (!nodeStatuses[url]) {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    promise.catch(() => {});
    nodeStatuses[url] = {
      promise, resolve, reject, requests: 0,
    };
  }
  return nodeStatuses[url];
}

function respond(network) {
  nodeStatus(network.protocols.aeternity.nodeUrl)
    .resolve({ networkId: `ae_${network.name}`, nodeVersion: '7.3.0' });
}

function statusRequests(network) {
  return nodeStatus(network.protocols.aeternity.nodeUrl).requests;
}

function nodesOf(sdk) {
  return { names: [...sdk.pool.keys()], selectedUrl: sdk.api.$host };
}

describe('useAeSdk().resetNode', () => {
  let useAeSdk;

  beforeEach(async () => {
    vi.resetModules();
    nodeStatuses = {};
    activeNetworkName = ref('A');
    createdSdks = [];
    vi.spyOn(Node.prototype, 'getStatus').mockImplementation(function getStatus() {
      const status = nodeStatus(this.$host);
      status.requests += 1;
      return status.promise;
    });

    vi.doMock('@/protocols/aeternity/libs/AeSdkSuperhero', async (importOriginal) => {
      const { AeSdkSuperhero } = await importOriginal();
      return {
        AeSdkSuperhero: class extends AeSdkSuperhero {
          constructor(...args) {
            super(...args);
            createdSdks.push(this);
          }
        },
      };
    });
    vi.doMock('@/lib/FramesConnection', () => ({ FramesConnection: { initialized: true } }));
    vi.doMock('@/protocols/aeternity/composables', () => ({
      useAeNetworkSettings: () => ({
        aeActiveNetworkSettings: {
          get value() {
            return NETWORKS[activeNetworkName.value].protocols.aeternity;
          },
        },
      }),
    }));
    vi.doMock('@/composables/networks', () => ({
      useNetworks: () => ({
        activeNetworkName,
        areNetworksRestored: ref(true),
        onNetworkChange: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/accounts', () => ({
      useAccounts: () => ({
        accountsAddressList: ref([]),
        getLastActiveProtocolAccount: vi.fn(),
        onAccountChange: vi.fn(),
      }),
    }));
    vi.doMock('@/composables/permissions', () => ({
      usePermissions: () => ({ checkOrAskPermission: vi.fn() }),
    }));

    ({ useAeSdk } = await import('@/composables/aeSdk'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function createSdkOn(network) {
    const composable = useAeSdk();
    respond(network);
    return { composable, aeSdk: await composable.getAeSdk() };
  }

  it('applies the latest switch without waiting for an older one still in flight', async () => {
    const { composable, aeSdk } = await createSdkOn(NETWORKS.A);

    composable.resetNode(NETWORKS.B);
    await vi.waitFor(() => expect(statusRequests(NETWORKS.B)).toBe(1));
    const switchingToC = composable.resetNode(NETWORKS.C);
    respond(NETWORKS.C);
    await switchingToC;

    expect(nodesOf(aeSdk)).toEqual({ names: ['C'], selectedUrl: 'https://c.example' });
    expect(composable.nodeNetworkId.value).toBe('ae_C');
    expect(composable.isAeSdkReady.value).toBeTruthy();
    await expect(composable.getAeSdk()).resolves.toBe(aeSdk);

    // The outdated switch finishing late changes nothing.
    respond(NETWORKS.B);
    await vi.waitFor(() => expect(composable.isAeNodeConnecting.value).toBe(false));
    expect(nodesOf(aeSdk).names).toEqual(['C']);
    expect(composable.nodeNetworkId.value).toBe('ae_C');
  });

  it('keeps the network id matching the selected node while a switch is pending', async () => {
    const { composable, aeSdk } = await createSdkOn(NETWORKS.A);

    composable.resetNode(NETWORKS.B);
    await vi.waitFor(() => expect(statusRequests(NETWORKS.B)).toBe(1));
    const switchingToC = composable.resetNode(NETWORKS.C);
    respond(NETWORKS.B);
    await vi.waitFor(() => expect(statusRequests(NETWORKS.C)).toBe(1));

    // Transactions are signed with `nodeNetworkId`: it must not name an outdated network.
    expect(nodesOf(aeSdk).names).toEqual(['A']);
    expect(composable.nodeNetworkId.value).toBe('ae_A');
    expect(composable.isAeSdkReady.value).toBeFalsy();

    respond(NETWORKS.C);
    await switchingToC;
    expect(nodesOf(aeSdk).names).toEqual(['C']);
    expect(composable.nodeNetworkId.value).toBe('ae_C');
  });

  it('does not request the node status of a switch outdated before it started', async () => {
    const { composable, aeSdk } = await createSdkOn(NETWORKS.A);

    composable.resetNode(NETWORKS.B);
    respond(NETWORKS.C);
    await composable.resetNode(NETWORKS.C);

    expect(statusRequests(NETWORKS.B)).toBe(0);
    expect(nodesOf(aeSdk)).toEqual({ names: ['C'], selectedUrl: 'https://c.example' });
  });

  it('switches to a network whose name is already in the pool (edited node URL)', async () => {
    const { composable, aeSdk } = await createSdkOn(NETWORKS.A);
    const editedA = { name: 'A', protocols: { aeternity: { nodeUrl: 'https://a2.example' } } };
    respond(editedA);

    await composable.resetNode(editedA);

    expect(nodesOf(aeSdk)).toEqual({ names: ['A'], selectedUrl: 'https://a2.example' });
    await expect(composable.getAeSdk()).resolves.toBe(aeSdk);
  });

  it('stays usable when a switch has no network (active network being removed)', async () => {
    const { composable, aeSdk } = await createSdkOn(NETWORKS.A);

    await composable.resetNode(undefined);
    expect(composable.isAeSdkReady.value).toBeTruthy();

    respond(NETWORKS.B);
    await composable.resetNode(NETWORKS.B);
    expect(nodesOf(aeSdk)).toEqual({ names: ['B'], selectedUrl: 'https://b.example' });
  });

  it('switches to an unreachable node without an unhandled rejection', async () => {
    const { composable, aeSdk } = await createSdkOn(NETWORKS.A);
    nodeStatus(NETWORKS.B.protocols.aeternity.nodeUrl).reject(new Error('Network down'));

    await composable.resetNode(NETWORKS.B);
    // Let the SDK's own `selectNode` network id request settle.
    await new Promise((resolve) => { setTimeout(resolve, 0); });

    expect(nodesOf(aeSdk)).toEqual({ names: ['B'], selectedUrl: 'https://b.example' });
    expect(composable.nodeNetworkId.value).toBeUndefined();
    expect(composable.isAeNodeError.value).toBe(true);
    expect(composable.isAeSdkReady.value).toBeTruthy();
  });

  it('applies a switch requested while the SDK is still being created', async () => {
    const composable = useAeSdk();
    const creating = composable.getAeSdk(); // waits for node A
    const switching = composable.resetNode(NETWORKS.B);
    respond(NETWORKS.B); // only asked once the SDK exists

    respond(NETWORKS.A);
    const aeSdk = await creating;
    await switching;

    expect(nodesOf(aeSdk)).toEqual({ names: ['B'], selectedUrl: 'https://b.example' });
    expect(composable.nodeNetworkId.value).toBe('ae_B');
  });

  it('does not hand out a just created SDK before a pending switch is applied', async () => {
    const composable = useAeSdk();
    const creating = composable.getAeSdk();
    const switching = composable.resetNode(NETWORKS.B);
    respond(NETWORKS.A);
    const aeSdk = await creating;

    const sdkAfterSwitch = composable.getAeSdk();
    await vi.waitFor(() => expect(statusRequests(NETWORKS.B)).toBe(1));
    expect(composable.isAeSdkReady.value).toBeFalsy();

    respond(NETWORKS.B);
    await switching;
    await expect(sdkAfterSwitch).resolves.toBe(aeSdk);
    expect(nodesOf(aeSdk).names).toEqual(['B']);
  });

  it('creates one SDK for callers that waited for a switch made before it existed', async () => {
    const composable = useAeSdk();
    const switching = composable.resetNode(NETWORKS.B);
    activeNetworkName.value = 'B';
    const callers = [composable.getAeSdk(), composable.getAeSdk()];

    respond(NETWORKS.B);
    await switching;
    const [first, second] = await Promise.all(callers);

    expect(first).toBeTruthy();
    expect(second).toBe(first);
    expect(createdSdks).toEqual([first]);
    expect(nodesOf(first)).toEqual({ names: ['B'], selectedUrl: 'https://b.example' });
  });

  it('switches the dry SDK used for multisig as well', async () => {
    const { composable } = await createSdkOn(NETWORKS.A);
    const dryAeSdk = await composable.getDryAeSdk();

    respond(NETWORKS.C);
    await composable.resetNode(NETWORKS.C);

    expect(nodesOf(dryAeSdk)).toEqual({ names: ['C'], selectedUrl: 'https://c.example' });
  });
});
