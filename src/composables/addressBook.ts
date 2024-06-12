import { computed } from 'vue';

import { PROTOCOLS, STORAGE_KEYS } from '@/constants';
import { AccountAddress, Protocol } from '@/types';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { getProtocolByAddress } from '@/utils';
import { useStorageRef } from './storageRef';

export interface IAddressBookEntry {
  name: string;
  address: AccountAddress;
  isBookmarked: boolean;
  protocol: Protocol;
}

export type IAddressBook = Record<AccountAddress, IAddressBookEntry>;

interface IAddressBookOptions {
  name: string;
  address: AccountAddress;
  isBookmarked?: boolean;
}

const addressBook = useStorageRef<IAddressBook>({}, STORAGE_KEYS.addressBook);

export function useAddressBook() {
  const addressBookOrderedByName = computed(
    () => Object.values(addressBook.value).sort((a, b) => a.name.localeCompare(b.name)),
  );

  // Check if addressBook entry exists (string)
  function addressBookEntryExists(address: AccountAddress) {
    return !!addressBook.value[address];
  }

  // Add addressBook entry (name, address)
  function addAddressBookEntry(
    { name, address, isBookmarked }: IAddressBookOptions,
    isEdit = false,
  ) {
    if (addressBookEntryExists(address) && !isEdit) {
      throw new Error('Address book entry already exists');
    }

    const protocol = getProtocolByAddress(address);
    const defaultProtocol = isEdit ? addressBook.value[address].protocol : PROTOCOLS.aeternity;
    const defaultIsBookmarked = isEdit ? addressBook.value[address].isBookmarked : false;

    addressBook.value[address] = {
      name,
      address,
      protocol: protocol || defaultProtocol,
      isBookmarked: isBookmarked || defaultIsBookmarked,
    };
  }

  // Edit addressBook entry (name, address)
  function editAddressBookEntry({ name, address }: IAddressBookOptions) {
    if (!addressBookEntryExists(address)) {
      return;
    }
    const adapter = ProtocolAdapterFactory.getAdapterByAccountAddress(address);
    const protocol = adapter?.protocol || addressBook.value[address].protocol;

    addressBook.value[address] = {
      name,
      address,
      protocol,
      isBookmarked: addressBook.value[address].isBookmarked,
    };
  }

  // Remove addressBook entry (address)
  function removeAddressBookEntry(address: AccountAddress) {
    if (addressBookEntryExists(address)) {
      delete addressBook.value[address];
    }
  }

  function getAddressBookEntryByAddress(address: AccountAddress) {
    if (addressBookEntryExists(address)) {
      return addressBook.value[address];
    }
    return null;
  }

  function toggleBookmarkAddressBookEntry(address: AccountAddress) {
    if (addressBookEntryExists(address)) {
      addressBook.value[address].isBookmarked = !addressBook.value[address].isBookmarked;
    }
  }

  // Export addressBook as json
  function exportAddressBook() {
    // TODO: Implement exportAddressBook
    return JSON.stringify(addressBook.value);
  }

  // Import addressBook from json
  function importAddressBook(json: string) {
    // TODO: Implement importAddressBook
    addressBook.value = JSON.parse(json);
  }

  return {
    addressBook,
    addressBookOrderedByName,

    addressBookEntryExists,
    addAddressBookEntry,
    editAddressBookEntry,
    removeAddressBookEntry,
    getAddressBookEntryByAddress,
    toggleBookmarkAddressBookEntry,

    exportAddressBook,
    importAddressBook,
  };
}
