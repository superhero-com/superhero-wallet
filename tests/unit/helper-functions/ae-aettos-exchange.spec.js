import BigNumber from 'bignumber.js';
import { AE_COIN_PRECISION } from '../../../src/protocols/aeternity/config';
import { aeToAettos, aettosToAe } from '../../../src/protocols/aeternity/helpers';

const testValues = [{
  value: 1,
}, {
  value: '1',
}, {
  value: 0,
}, {
  value: 0.123456789123456789,
}, {
  value: null,
  isError: true,
}, {
  value: {},
  isError: true,
}, {
  value: undefined,
  isError: true,
}, {
  value: NaN,
  isError: true,
}, {
  value: [],
  isNaN: true,
}];

describe('AE <-> aettos denomination', () => {
  testValues.forEach((test) => it('should accept only numbers or numbers in string as parameters', () => {
    if (test.isError) {
      expect(() => aeToAettos(test.value)).toThrow(Error);
      expect(() => aettosToAe(test.value)).toThrow(Error);
      return;
    }
    if (test.isNaN) {
      expect(aeToAettos(test.value)).toBe('NaN');
      expect(aettosToAe(test.value)).toBe('NaN');
      return;
    }
    expect(aeToAettos(test.value)).not.toBe('NaN');
    expect(typeof aeToAettos(test.value)).toBe('string');
    expect(BigNumber(test.value).shiftedBy(AE_COIN_PRECISION)
      .isEqualTo(aeToAettos(test.value))).toBeTruthy();

    expect(aettosToAe(test.value)).not.toBe('NaN');
    expect(typeof aettosToAe(test.value)).toBe('string');
    expect(BigNumber(test.value).shiftedBy(-AE_COIN_PRECISION)
      .isEqualTo(aettosToAe(test.value))).toBeTruthy();
  }));
  it('should return initial value after both functions will be triggered', () => {
    const value = 10;
    expect(aeToAettos(aettosToAe(value))).toEqual(value.toString());
  });
});
