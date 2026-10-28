import type { Protocol } from '@/types';

const EVM_ADDRESS = '0x0000000000000000000000000000000000000001';
const BTC_ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';

/**
 * Discovery reports an incomplete restore only for a check that rejects.
 * `web3` fetches through `cross-fetch`, not `global.fetch`, so its HTTP provider is stubbed:
 * every call style ends up there, whichever `web3-eth` export or method an adapter uses.
 */
describe('isAccountUsed when the node fails', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  /** From a fresh module graph, so the mocks apply to the adapters. */
  async function loadAdapter(protocol: Protocol) {
    await import('@/protocols/registerAdapters');
    const { ProtocolAdapterFactory } = await import('@/lib/ProtocolAdapterFactory');
    return ProtocolAdapterFactory.getAdapter(protocol);
  }

  it.each([
    'ethereum',
    'bnb',
    'avalanche',
    'polygonPos',
  ] as Protocol[])('%s fails rather than calling the account unused', async (protocol) => {
    const { HttpProvider } = await import('web3-providers-http');
    vi.spyOn(HttpProvider.prototype, 'request').mockRejectedValue(new Error('node down'));
    const adapter = await loadAdapter(protocol);

    await expect(adapter.isAccountUsed(EVM_ADDRESS)).rejects.toThrow('node down');
  });

  it('bitcoin fails rather than calling the account unused', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('node down'));
    const adapter = await loadAdapter('bitcoin');

    await expect(adapter.isAccountUsed(BTC_ADDRESS)).rejects.toThrow('node down');
  });
});
