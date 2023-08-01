import { isAensNameValid } from '../../../src/protocols/aeternity/helpers';

const testErrors = [
  { name: undefined },
];

const testNames = [
  { name: 'test.chain' },
  { name: '123.chain' },
  { name: 'test123.chain' },
  { name: 'ęóąśłćżźćń.chain' },
  { name: 'test123.chai', error: true },
  { name: '.chain', error: true },
];

describe('checkAens', () => {
  testErrors.forEach((test) => it('should throw an error', () => {
    expect(() => isAensNameValid(test.hash)).toThrow();
  }));
  testNames.forEach((test) => it('should allow only letters and numbers followed by ".chain" as aens name', () => {
    const result = isAensNameValid(test.name);
    expect(result).toBe(!test.error);
  }));
});
