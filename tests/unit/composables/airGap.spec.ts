import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';

const createV3SerializerCompanion = vi.fn(async () => ({
  schemas: [
    { type: 1, schema: {} },
    { type: 2, schema: {} },
  ],
}));
const addSchema = vi.fn();
const getInstance = vi.fn(() => ({ __mockSerializerInstance: true }));

vi.mock('@airgap/aeternity', () => ({
  AeternityModule: vi.fn().mockImplementation(class AeternityModuleMock {
    createV3SerializerCompanion = createV3SerializerCompanion;
  }),
}));

vi.mock('@airgap/serializer', () => ({
  SerializerV3: { addSchema, getInstance },
}));

vi.mock('airgap-coin-lib', () => ({
  MainProtocolSymbols: { AE: 'ae' },
  IACMessageType: {},
}));

describe('useAirGap getSerializer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('initializes the serializer exactly once when called concurrently', async () => {
    const { useAirGap } = await import('@/composables/airGap');
    const { getSerializer } = useAirGap();

    const [first, second] = await Promise.all([getSerializer(), getSerializer()]);

    expect(first).toBe(second);
    expect(createV3SerializerCompanion).toHaveBeenCalledTimes(1);
    expect(addSchema).toHaveBeenCalledTimes(2);
    expect(getInstance).toHaveBeenCalledTimes(1);
  });

  it('reuses the same serializer on later sequential calls', async () => {
    const { useAirGap } = await import('@/composables/airGap');
    const { getSerializer } = useAirGap();

    await getSerializer();
    await getSerializer();

    expect(createV3SerializerCompanion).toHaveBeenCalledTimes(1);
    expect(addSchema).toHaveBeenCalledTimes(2);
  });

  it('retries initialization after a failed attempt instead of caching the rejection', async () => {
    createV3SerializerCompanion.mockRejectedValueOnce(new Error('transient chunk load failure'));

    const { useAirGap } = await import('@/composables/airGap');
    const { getSerializer } = useAirGap();

    await expect(getSerializer()).rejects.toThrow('transient chunk load failure');

    // A later call must re-attempt (not return the cached rejected promise).
    const serializer = await getSerializer();
    expect(serializer).toEqual({ __mockSerializerInstance: true });
    expect(createV3SerializerCompanion).toHaveBeenCalledTimes(2);
  });
});
