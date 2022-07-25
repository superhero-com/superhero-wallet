import { checkAensName } from '../../../src/popup/utils/helper';

const testNames = [
  { name: 'test.chain' },
  { name: '123.chain' },
  { name: 'test123.chain' },
  { name: 'ęóąśłćżźćń.chain' },
  { name: 'test123.chai', error: true },
  { name: undefined, error: true },
  { name: '.chain', error: true },
];

describe('checkAens', () => {
  testNames.forEach((test) => it('should allow only letters and numbers followed by ".chain" as aens name', () => {
    const result = checkAensName(test.name);
    expect(result).toBe(!test.error);
  }));
});
