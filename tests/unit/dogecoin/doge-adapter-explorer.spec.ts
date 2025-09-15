import { expect } from '@jest/globals';
import { DogecoinAdapter } from '../../../src/protocols/dogecoin/libs/DogecoinAdapter';

describe('DogecoinAdapter - explorer URLs', () => {
  const adapter = new DogecoinAdapter();
  it('prepares account and tx urls', () => {
    const explorer = adapter.getExplorer();
    const addr = '0x0000000000000000000000000000000000000000';
    const tx = '0x1234';
    expect(explorer.prepareUrlForAccount(addr)).toContain(addr);
    expect(explorer.prepareUrlForHash(tx)).toContain(tx);
  });
});
