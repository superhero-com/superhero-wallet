import type { IAddressBookEntry, Migration } from '@/types';
import { isEvm } from '@/utils';
import { toEvmChecksumAddress } from '@/protocols/evm/helpers';

/**
 * EVM addresses were saved as typed, e.g. in lowercase, and didn't match the same address
 * elsewhere. One that another entry already holds in the EIP-55 form stays as it is,
 * so that no entry is lost or doubled.
 */
const migration: Migration<IAddressBookEntry[] | null> = async (restoredValue) => {
  if (!Array.isArray(restoredValue)) {
    return restoredValue;
  }
  const addresses = new Set(restoredValue.map((entry) => entry?.address));
  let isChanged = false;
  const entries = restoredValue.map((entry) => {
    if (!isEvm(entry?.protocol) || typeof entry.address !== 'string') {
      return entry;
    }
    const address = toEvmChecksumAddress(entry.address);
    if (addresses.has(address)) {
      return entry;
    }
    addresses.add(address);
    isChanged = true;
    return { ...entry, address };
  });
  return isChanged ? entries : restoredValue;
};

export default migration;
