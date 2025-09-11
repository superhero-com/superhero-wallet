import { PROTOCOLS, EVM_PROTOCOLS } from '../../../src/constants';
import { isEvm } from '../../../src/utils';

describe('EVM utils and constants', () => {
  it('EVM_PROTOCOLS contains ethereum and bnb only', () => {
    expect(EVM_PROTOCOLS).toEqual([PROTOCOLS.ethereum, PROTOCOLS.bnb, PROTOCOLS.avalanche]);
  });

  it('isEvm detects EVM protocols', () => {
    expect(isEvm(PROTOCOLS.ethereum)).toBe(true);
    expect(isEvm(PROTOCOLS.bnb)).toBe(true);
  });

  it('isEvm rejects non-EVM protocols and nullish', () => {
    expect(isEvm(PROTOCOLS.aeternity)).toBe(false);
    expect(isEvm(PROTOCOLS.bitcoin)).toBe(false);
    expect(isEvm(null)).toBe(false);
    expect(isEvm(undefined)).toBe(false);
  });
});
