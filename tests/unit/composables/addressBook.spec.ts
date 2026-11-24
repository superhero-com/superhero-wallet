// @ts-nocheck
const ITEM_KEY = 'sh-wallet_address-book';
const CHECKSUM = '0x5F00d657054991f0cb23Ce9EbAf073133a130762';
const LOWER = CHECKSUM.toLowerCase();
const UPPER = `0x${CHECKSUM.slice(2).toUpperCase()}`;
const OTHER = '0x909C407d6FD235DE14db97e2234fCB71E99d6E1c';
const AE = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';
const SOL = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

const nextTask = () => new Promise((resolve) => { setTimeout(resolve, 0); });
const stored = () => JSON.parse(localStorage.getItem(ITEM_KEY));
const pairs = (entries) => entries.map(({ name, address }) => [name, address]);

function entry(address, name = 'Bob', isBookmarked = false) {
  return {
    name, address, protocol: 'ethereum', isBookmarked,
  };
}

describe('address book with EVM addresses', () => {
  let addressBook;
  let errors;

  async function load(storedEntries) {
    vi.resetModules();
    localStorage.clear();
    // Before the modules load, which restore the address book
    if (storedEntries) localStorage.setItem(ITEM_KEY, JSON.stringify(storedEntries));
    await import('@/protocols/registerAdapters');
    const { useAddressBook } = await import('@/composables/addressBook');
    errors = await import('@/lib/errors');
    await nextTask();
    addressBook = useAddressBook();
  }

  it('checksums the stored entries on restore', async () => {
    await load([entry(LOWER, 'Bob', true)]);

    expect(addressBook.addressBook.value).toEqual([entry(CHECKSUM, 'Bob', true)]);
    expect(stored()).toEqual([entry(CHECKSUM, 'Bob', true)]);
    expect(addressBook.getAddressBookEntryByAddress(CHECKSUM)?.name).toBe('Bob');
  });

  it('saves an address checksummed and refuses it in another case', async () => {
    await load();
    addressBook.addAddressBookEntry({ name: 'Bob', address: LOWER.slice(2) });

    [LOWER, UPPER, `0X${CHECKSUM.slice(2)}`, CHECKSUM].forEach((address) => {
      expect(() => addressBook.addAddressBookEntry({ name: 'Carol', address }))
        .toThrow(errors.AddressBookEntryExists);
    });
    await nextTask();
    expect(pairs(stored())).toEqual([['Bob', CHECKSUM]]);
  });

  it('refuses a wrong checksum as before', async () => {
    await load();
    expect(() => addressBook.addAddressBookEntry({
      name: 'Bob', address: '0x5f00D657054991f0cb23Ce9EbAf073133a130762',
    })).toThrow(errors.AddressBookInvalidAddress);
  });

  it('keeps addresses of other protocols as typed', async () => {
    await load();
    addressBook.addAddressBookEntry({ name: 'Alice', address: AE });
    addressBook.addAddressBookEntry({ name: 'Sol', address: SOL });

    expect(pairs(addressBook.addressBook.value)).toEqual([['Alice', AE], ['Sol', SOL]]);
  });

  it('edits an entry given in another case', async () => {
    await load([entry(CHECKSUM, 'Bob', true)]);

    addressBook.addAddressBookEntry({ name: 'Bobby', address: LOWER }, CHECKSUM);
    expect(addressBook.addressBook.value).toEqual([entry(CHECKSUM, 'Bobby', true)]);

    addressBook.addAddressBookEntry({ name: 'Bobby', address: OTHER.toLowerCase() }, CHECKSUM);
    expect(pairs(addressBook.addressBook.value)).toEqual([['Bobby', OTHER]]);
  });

  it('edits and removes an earlier duplicate without touching its twin', async () => {
    await load([entry(LOWER, 'first'), entry(UPPER, 'second')]);
    expect(pairs(addressBook.addressBook.value)).toEqual([['first', CHECKSUM], ['second', UPPER]]);

    addressBook.addAddressBookEntry({ name: 'renamed', address: UPPER }, UPPER);
    addressBook.toggleBookmarkAddressBookEntry(UPPER);
    expect(addressBook.addressBook.value).toEqual([
      entry(CHECKSUM, 'first'),
      entry(UPPER, 'renamed', true),
    ]);

    addressBook.removeAddressBookEntry(UPPER);
    expect(pairs(addressBook.addressBook.value)).toEqual([['first', CHECKSUM]]);
  });
});
