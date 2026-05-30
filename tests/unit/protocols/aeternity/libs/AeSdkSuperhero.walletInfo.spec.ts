import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

const notify = jest.fn();

jest.mock('@aeternity/aepp-sdk', () => ({
  AeSdkWallet: class {},
  METHODS: {
    readyToConnect: 'connection.announcePresence',
  },
  sendTransaction: jest.fn(),
  spend: jest.fn(),
}));

describe('AeSdkSuperhero wallet info sharing', () => {
  beforeEach(() => {
    notify.mockClear();
  });

  async function createSdkStub(overrides: Record<string, unknown> = {}) {
    const { AeSdkSuperhero } = await import('@/protocols/aeternity/libs/AeSdkSuperhero');
    const { api: apiOverride, ...rest } = overrides;
    const sdk = Object.create(AeSdkSuperhero.prototype);

    Object.assign(sdk, {
      id: 'Superhero Wallet',
      name: 'Superhero',
      _type: 'window',
      nodeNetworkId: { value: undefined },
      isNodeConnected: () => false,
      _getClient: jest.fn(() => ({ rpc: { notify } })),
      ...rest,
    });
    // `api` is a getter on AeSdkBase; define it explicitly on the stub.
    Object.defineProperty(sdk, 'api', {
      value: apiOverride ?? { getNetworkId: jest.fn() },
      configurable: true,
    });
    return sdk;
  }

  it('announces minimal wallet presence without network details', async () => {
    const sdk = await createSdkStub();

    await sdk.shareWalletInfo('client-id');

    expect(notify).toHaveBeenCalledWith('connection.announcePresence', {
      id: 'Superhero Wallet',
      name: 'Superhero',
      origin: window.location.origin,
      type: 'window',
    });
    expect(notify.mock.calls[0][1]).not.toHaveProperty('networkId');
  });

  it('getWalletInfo prefers nodeNetworkId without calling the node', async () => {
    const getNetworkId = jest.fn();
    const sdk = await createSdkStub({
      nodeNetworkId: { value: 'ae_mainnet' },
      isNodeConnected: () => true,
      api: { getNetworkId },
    });

    const info = await sdk.getWalletInfo();

    expect(info.networkId).toBe('ae_mainnet');
    expect(getNetworkId).not.toHaveBeenCalled();
  });

  it('getWalletInfo falls back to api.getNetworkId when nodeNetworkId is missing', async () => {
    const getNetworkId = jest.fn(async () => 'ae_uat');
    const sdk = await createSdkStub({
      nodeNetworkId: { value: undefined },
      isNodeConnected: () => true,
      api: { getNetworkId },
    });

    const info = await sdk.getWalletInfo();

    expect(getNetworkId).toHaveBeenCalled();
    expect(info.networkId).toBe('ae_uat');
  });

  it('getWalletInfo does not reject when api.getNetworkId fails', async () => {
    const getNetworkId = jest.fn(async () => { throw new Error('node unreachable'); });
    const sdk = await createSdkStub({
      nodeNetworkId: { value: undefined },
      isNodeConnected: () => true,
      api: { getNetworkId },
    });

    await expect(sdk.getWalletInfo()).resolves.toMatchObject({
      id: 'Superhero Wallet',
      name: 'Superhero',
      networkId: undefined,
    });
  });
});
