import { getNameRegistrationState } from '@/protocols/aeternity/helpers/nameRegistration';
import { restError } from '../../../helpers/restError';

function createNode() {
  return {
    getNameEntryByName: vi.fn().mockRejectedValue(restError('Name not found', { statusCode: 404 })),
    getAuctionEntryByName: vi.fn().mockRejectedValue(restError('Auction not found', { statusCode: 404 })),
  };
}

describe('getNameRegistrationState', () => {
  it('rejects an owned name without looking up its auction', async () => {
    const node = createNode();
    node.getNameEntryByName.mockResolvedValue({ owner: 'ak_owner' });

    expect(await getNameRegistrationState('short.chain', node)).toBe('registered');
    expect(node.getAuctionEntryByName).not.toHaveBeenCalled();
  });

  it('distinguishes an auction from an available name', async () => {
    const node = createNode();
    node.getAuctionEntryByName.mockResolvedValue({ highestBidder: 'ak_bidder' });

    expect(await getNameRegistrationState('short.chain', node)).toBe('auction');
    expect(node.getAuctionEntryByName).toHaveBeenCalledWith('short.chain');
  });

  it.each(['short.chain', 'abcdefghijkl.chain'] as const)(
    'allows %s to start its first auction after both lookups return 404',
    async (name) => {
      const node = createNode();

      expect(await getNameRegistrationState(name, node)).toBe('available');
      expect(node.getAuctionEntryByName).toHaveBeenCalledWith(name);
    },
  );

  it.each(['abcdefghijklm.chain', 'éééééééé.chain'] as const)(
    'uses the SDK auction eligibility for %s',
    async (name) => {
      const node = createNode();

      expect(await getNameRegistrationState(name, node)).toBe('available');
      expect(node.getAuctionEntryByName).not.toHaveBeenCalled();
    },
  );

  it.each([
    restError('Unavailable', { statusCode: 503 }),
    restError('Bad request', { statusCode: 400 }),
    restError('Disconnected', { code: 'REQUEST_SEND_ERROR' }),
    new Error('Unexpected response'),
  ])('propagates a name lookup failure: %s', async (error) => {
    const node = createNode();
    node.getNameEntryByName.mockRejectedValue(error);

    await expect(getNameRegistrationState('short.chain', node)).rejects.toBe(error);
    expect(node.getAuctionEntryByName).not.toHaveBeenCalled();
  });

  it.each([
    restError('Unavailable', { statusCode: 503 }),
    restError('Forbidden', { statusCode: 403 }),
    restError('Disconnected', { code: 'REQUEST_SEND_ERROR' }),
    new Error('Unexpected response'),
  ])('propagates an auction lookup failure: %s', async (error) => {
    const node = createNode();
    node.getAuctionEntryByName.mockRejectedValue(error);

    await expect(getNameRegistrationState('short.chain', node)).rejects.toBe(error);
  });
});
