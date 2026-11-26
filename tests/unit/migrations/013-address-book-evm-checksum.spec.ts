import type { IAddressBookEntry, Protocol } from '@/types';
import { PROTOCOLS } from '@/constants';
import migration from '@/migrations/013-address-book-evm-checksum';

const CHECKSUM = '0x5F00d657054991f0cb23Ce9EbAf073133a130762';
const LOWER = CHECKSUM.toLowerCase();
const UPPER = `0x${CHECKSUM.slice(2).toUpperCase()}`;
const OTHER = '0x909C407d6FD235DE14db97e2234fCB71E99d6E1c';
const AE = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';

function entry(
  address: string,
  name = 'Bob',
  protocol: Protocol = PROTOCOLS.ethereum,
): IAddressBookEntry {
  return {
    name, address, protocol, isBookmarked: false,
  };
}

describe('migration 013: checksum EVM addresses in the address book', () => {
  it('checksums the EVM entries and keeps the others', async () => {
    const result = await migration([
      entry(LOWER),
      entry(OTHER.slice(2).toLowerCase(), 'Carol', PROTOCOLS.bnb),
      entry(AE, 'Alice', PROTOCOLS.aeternity),
    ]);
    expect(result).toEqual([
      entry(CHECKSUM),
      entry(OTHER, 'Carol', PROTOCOLS.bnb),
      entry(AE, 'Alice', PROTOCOLS.aeternity),
    ]);
  });

  it('keeps an address another entry already holds checksummed', async () => {
    const result = await migration([entry(LOWER, 'first'), entry(UPPER, 'second'), entry(CHECKSUM, 'third')]);
    expect(result!.map(({ address }) => address)).toEqual([LOWER, UPPER, CHECKSUM]);
  });

  it('checksums only the first of two entries in different case', async () => {
    const result = await migration([entry(LOWER, 'first'), entry(UPPER, 'second')]);
    expect(result!.map(({ name, address }) => [name, address])).toEqual([
      ['first', CHECKSUM],
      ['second', UPPER],
    ]);
  });

  it('returns the value untouched when there is nothing to checksum', async () => {
    const value = [
      entry(CHECKSUM),
      entry('0x5f00D657054991f0cb23Ce9EbAf073133a130762', 'wrong checksum'),
      { ...entry(LOWER, 'no protocol'), protocol: undefined as any },
      entry(AE, 'Alice', PROTOCOLS.aeternity),
    ];
    await expect(migration(value)).resolves.toBe(value);
  });

  it.each([
    ['null', null],
    ['an object', { [LOWER]: entry(LOWER) }],
  ])('passes %s through', async (_, value) => {
    await expect(migration(value)).resolves.toBe(value);
  });
});
