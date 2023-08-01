import BigNumber from 'bignumber.js';
import { toShiftedBigNumber } from '../../../src/utils';

const invalidInput = [null, 'test', undefined, {}, [], NaN, '1', '-1'];

const powers = Array.from(Array(61), (_, index) => index - 30);

describe('toShiftedBigNumber', () => {
  powers.forEach((power) => it('should move decimal point n places to desired direction', () => {
    const value = '1234.9876123456789123456789123456789';
    const expectedResult = new BigNumber(value).shiftedBy(power);
    expect(expectedResult.isEqualTo(toShiftedBigNumber(value, power))).toBeTruthy();
  }));
  invalidInput.forEach((precision) => it('should throw an error on precision with type other than number', () => {
    expect(() => toShiftedBigNumber(1, precision)).toThrowError();
  }));
});
