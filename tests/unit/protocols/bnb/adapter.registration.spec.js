import { ProtocolAdapterFactory } from '../../../../src/lib/ProtocolAdapterFactory';
import { PROTOCOLS } from '../../../../src/constants';
import { BnbAdapter } from '../../../../src/protocols/bnb/libs/BnbAdapter';

describe('BnbAdapter registration and metadata', () => {
  it('factory returns BnbAdapter instance for PROTOCOLS.bnb', () => {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.bnb);
    expect(adapter).toBeInstanceOf(BnbAdapter);
  });

  it('coin metadata is set (name, symbol, contractId, decimals)', () => {
    const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.bnb);
    const defaultCoin = adapter.getDefaultCoin();
    expect(defaultCoin.symbol).toBe(adapter.coinSymbol);
    expect(defaultCoin.contractId).toBe(adapter.coinContractId);
    expect(defaultCoin.decimals).toBe(adapter.coinPrecision);
    expect(defaultCoin.name).toBe(adapter.coinName);
  });
});
