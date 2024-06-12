import { computed, ref } from 'vue';

import {
  AccountAddress,
  IAddressBook,
  IAddressBookEntry,
  IAddressBookFilter,
} from '@/types';
import { ADDRESS_BOOK_FILTERS, PROTOCOLS, STORAGE_KEYS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { getProtocolByAddress, pipe } from '@/utils';
import { createCustomScopedComposable } from './composablesHelpers';
import { useStorageRef } from './storageRef';

interface IAddressBookOptions {
  name: string;
  address: AccountAddress;
  isBookmarked?: boolean;
}

export const useAddressBook = createCustomScopedComposable(() => {
  const addressBook = useStorageRef<IAddressBook>({}, STORAGE_KEYS.addressBook);

  const activeFilter = ref<IAddressBookFilter>(ADDRESS_BOOK_FILTERS.all);
  const searchQuery = ref<string>('');
  const showBookmarked = ref(false);

  function filterAddressBookByBookmarked(entries: IAddressBookEntry[]) {
    return showBookmarked.value ? entries.filter((entry) => entry.isBookmarked) : entries;
  }
  function filterAddressBook(entries: IAddressBookEntry[]) {
    switch (activeFilter.value) {
      case ADDRESS_BOOK_FILTERS.all:
        return entries;
      case ADDRESS_BOOK_FILTERS.bookmarked:
        return entries.filter((entry) => entry.isBookmarked);
      default:
        return activeFilter.value
          ? entries.filter((entry) => entry.protocol === activeFilter.value)
          : entries;
    }
  }
  function filterAddressBookBySearchPhrase(entries: IAddressBookEntry[]) {
    const searchQueryLower = searchQuery.value.toLowerCase();
    return entries.filter((entry) => {
      const nameLower = entry.name.toLowerCase();
      const addressLower = entry.address.toLowerCase();
      return nameLower.includes(searchQueryLower) || addressLower.includes(searchQueryLower);
    });
  }
  function sortAddressBookByName(entries: IAddressBookEntry[]) {
    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }

  const addressBookFiltered = computed(
    () => pipe([
      filterAddressBookByBookmarked,
      filterAddressBook,
      filterAddressBookBySearchPhrase,
      sortAddressBookByName,
    ])(Object.values(addressBook.value)),
  );

  function setFilter(filter: IAddressBookFilter) {
    activeFilter.value = filter;
  }
  function setShowBookmarked(value: boolean) {
    showBookmarked.value = value;
  }

  function addressBookEntryExists(address: AccountAddress) {
    return !!addressBook.value[address];
  }

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

  function exportAddressBook() {
    // TODO: Implement exportAddressBook
    return JSON.stringify(addressBook.value);
  }

  function importAddressBook(json: string) {
    // TODO: Implement importAddressBook
    addressBook.value = JSON.parse(json);
  }

  return {
    activeFilter,
    addressBook,
    addressBookFiltered,
    searchQuery,

    setFilter,
    setShowBookmarked,

    addressBookEntryExists,
    addAddressBookEntry,
    editAddressBookEntry,
    removeAddressBookEntry,
    getAddressBookEntryByAddress,
    toggleBookmarkAddressBookEntry,

    exportAddressBook,
    importAddressBook,
  };
});
