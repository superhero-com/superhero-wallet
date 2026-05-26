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

  it('announces minimal wallet presence without network details', async () => {
    const { AeSdkSuperhero } = await import('@/protocols/aeternity/libs/AeSdkSuperhero');
    const sdk = Object.create(AeSdkSuperhero.prototype);

    sdk.id = 'Superhero Wallet';
    sdk.name = 'Superhero';
    sdk._type = 'window';
    sdk._getClient = jest.fn(() => ({ rpc: { notify } }));

    await sdk.shareWalletInfo('client-id');

    expect(notify).toHaveBeenCalledWith('connection.announcePresence', {
      id: 'Superhero Wallet',
      name: 'Superhero',
      origin: window.location.origin,
      type: 'window',
    });
    expect(notify.mock.calls[0][1]).not.toHaveProperty('networkId');
  });
});
