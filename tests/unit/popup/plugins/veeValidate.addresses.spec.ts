import { validate } from 'vee-validate';
import type { IAddressBookEntry } from '@/types';
import { PROTOCOLS } from '@/constants';
import initVeeValidateRules from '@/popup/plugins/veeValidate';

const CHECKSUM = '0x5F00d657054991f0cb23Ce9EbAf073133a130762';
const LOWER = CHECKSUM.toLowerCase();
const UPPER = `0x${CHECKSUM.slice(2).toUpperCase()}`;
const WRONG_CHECKSUM = '0x5f00D657054991f0cb23Ce9EbAf073133a130762';
const OTHER = '0x909C407d6FD235DE14db97e2234fCB71E99d6E1c';
const AE = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';
const AE_OTHER = 'ak_2ELPCWzcTdiyYuumjaV4D7kE843d1Ts27zH1Y2LBMKDbNtfq1Q';
const EVM_VARIANTS = [
  CHECKSUM,
  LOWER,
  UPPER,
  LOWER.slice(2),
  `0X${CHECKSUM.slice(2)}`,
];

// Offline: the rules' composables never get a response
vi.stubGlobal('fetch', () => new Promise(() => {}));

beforeAll(() => {
  initVeeValidateRules();
});

describe('address_not_same_as', () => {
  async function validateRecipients(
    recipients: string[],
    ownAddress: string | null = CHECKSUM,
    protocol: string = PROTOCOLS.ethereum,
  ) {
    const { valid, errors } = await validate(
      recipients,
      { address_not_same_as: [ownAddress, protocol] },
    );
    return { valid, listed: errors[0]?.split('||')[1] };
  }

  it.each(EVM_VARIANTS)('warns for the own address typed as %s, listing it as typed', async (typed) => {
    expect(await validateRecipients([OTHER, typed])).toEqual({ valid: false, listed: typed });
  });

  it.each([OTHER, WRONG_CHECKSUM, '0x5f00'])('does not warn for %s', async (typed) => {
    expect((await validateRecipients([typed])).valid).toBe(true);
  });

  it('does not warn without an own address', async () => {
    expect((await validateRecipients([LOWER], null)).valid).toBe(true);
  });

  it('compares aeternity addresses as they are', async () => {
    expect((await validateRecipients([AE], AE, PROTOCOLS.aeternity)).valid).toBe(false);
    expect((await validateRecipients([AE_OTHER], AE, PROTOCOLS.aeternity)).valid).toBe(true);
  });
});

describe('address_book_entry_exists', () => {
  function entry(address: string, name = 'Bob'): IAddressBookEntry {
    return {
      name, address, protocol: PROTOCOLS.ethereum, isBookmarked: false,
    };
  }

  async function exists(
    value: string,
    entries: IAddressBookEntry[],
    savedValue?: string,
    type: 'name' | 'address' = 'address',
  ) {
    return !(await validate(
      value,
      { address_book_entry_exists: [entries, savedValue, type] },
    )).valid;
  }

  it.each(EVM_VARIANTS)('finds the saved address typed as %s', async (typed) => {
    expect(await exists(typed, [entry(CHECKSUM)])).toBe(true);
  });

  it('finds an entry saved as typed, as before', async () => {
    expect(await exists(LOWER, [entry(LOWER)])).toBe(true);
  });

  it('takes another address', async () => {
    expect(await exists(OTHER, [entry(CHECKSUM)])).toBe(false);
  });

  it('takes the edited entry back, also in another case', async () => {
    expect(await exists(CHECKSUM, [entry(CHECKSUM)], CHECKSUM)).toBe(false);
    expect(await exists(LOWER, [entry(CHECKSUM)], CHECKSUM)).toBe(false);
  });

  it('lets an earlier duplicate be edited, but not changed to another case of it', async () => {
    const entries = [entry(CHECKSUM, 'first'), entry(LOWER, 'second')];
    expect(await exists(LOWER, entries, LOWER)).toBe(false);
    expect(await exists(UPPER, entries, LOWER)).toBe(true);
    expect(await exists(LOWER, entries, CHECKSUM)).toBe(true);
  });

  it('compares names as before', async () => {
    const entries = [entry(CHECKSUM, 'Bob')];
    expect(await exists('Bob', entries, undefined, 'name')).toBe(true);
    expect(await exists('Bob', entries, 'Bob', 'name')).toBe(false);
    expect(await exists('bob', entries, undefined, 'name')).toBe(false);
  });
});
