import BigNumber from 'bignumber.js';
import {
  getAdjustedTransferTotal,
  getNonceWarningMessageKey,
} from '../../../../../src/protocols/aeternity/helpers/transferReview';

describe('Aeternity transfer review helpers', () => {
  it('replaces the estimated fee with the custom fee when calculating total', () => {
    expect(getAdjustedTransferTotal(1.0000117, new BigNumber('0.0000117'), new BigNumber('0.00001')))
      .toBeCloseTo(1.00001, 8);
  });

  it('returns the same adjusted total on repeated recalculation with the original estimated total', () => {
    const estimatedTotal = 1.0000117;

    expect(getAdjustedTransferTotal(estimatedTotal, '0.0000117', '0.00001'))
      .toBeCloseTo(1.00001, 8);
    expect(getAdjustedTransferTotal(estimatedTotal, '0.0000117', '0.00001'))
      .toBeCloseTo(1.00001, 8);
  });

  it('returns undefined when total is not available', () => {
    expect(getAdjustedTransferTotal(undefined, '0.1', '0.2')).toBeUndefined();
  });

  it('returns replacement warning when there is a pending transaction with the same nonce', () => {
    expect(getNonceWarningMessageKey(5, 5, true))
      .toBe('replacement');
  });

  it('returns low nonce warning when nonce is below the current nonce without a pending match', () => {
    expect(getNonceWarningMessageKey(4, 5, false))
      .toBe('low');
  });

  it('does not return nonce warning for current nonce without a pending match', () => {
    expect(getNonceWarningMessageKey(5, 5, false)).toBeUndefined();
  });
});
