import { computed, ref } from 'vue';
import { useFileDialog } from '@vueuse/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

import {
  AccountAddress,
  IAddressBook,
  IAddressBookEntry,
  IAddressBookFilter,
} from '@/types';
import { ADDRESS_BOOK_FILTERS, STORAGE_KEYS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { AddressBookEntryExists, AddressBookInvalidAddress, AddressBookRequiredFields } from '@/lib/errors';
import { getProtocolByAddress, handleUnknownError, pipe } from '@/utils';

import { createCustomScopedComposable } from './composablesHelpers';
import { useStorageRef } from './storageRef';
import { useModals } from './modals';

interface IAddressBookOptions {
  name: string;
  address: AccountAddress;
  isBookmarked?: boolean;
}

export const useAddressBook = createCustomScopedComposable(() => {
  const addressBook = useStorageRef<IAddressBook>({}, STORAGE_KEYS.addressBook);
  const { openDefaultModal } = useModals();

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
    if (!name || !address) {
      throw new AddressBookRequiredFields();
    }

    if (addressBookEntryExists(address) && !isEdit) {
      throw new AddressBookEntryExists();
    }

    const protocol = getProtocolByAddress(address);
    if (!protocol) {
      throw new AddressBookInvalidAddress();
    }
    const defaultIsBookmarked = isEdit ? addressBook.value[address].isBookmarked : false;

    addressBook.value[address] = {
      name,
      address,
      protocol,
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

  function addAddressBookEntriesFromJson(json: string) {
    try {
      const newEntries: IAddressBook = JSON.parse(json);
      const totalEntries = Object.keys(newEntries).length;
      let successfulEntriesCount = 0;
      let existingEntriesCount = 0;
      Object.values(newEntries).forEach((entry) => {
        try {
          addAddressBookEntry(entry);
          successfulEntriesCount += 1;
        } catch (error: any) {
          if (error instanceof AddressBookEntryExists) {
            existingEntriesCount += 1;
          } else {
            handleUnknownError(error);
          }
        }
      });

      // TODO Update to match new figma design
      openDefaultModal({
        title: `Importing ${totalEntries} address records`,
        msg: `Successfully imported ${successfulEntriesCount} address records.
          <br/> ${existingEntriesCount} address records already exist.
          <br/> ${totalEntries - successfulEntriesCount - existingEntriesCount} address records failed to import.`,
      });
    } catch (error) {
      handleUnknownError(error);
    }
  }

  // TODO move to utils
  function convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  async function exportAddressBook() {
    const json = JSON.stringify(addressBook.value);
    const blob = new Blob([json], { type: 'text/plain' });
    const a = document.createElement('a');
    const href = window.URL.createObjectURL(blob);
    const filename = 'addressBookExport.json';

    if (Capacitor.isNativePlatform()) {
      const base64 = await convertBlobToBase64(blob);
      const saveFile = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Documents,
      });
      const path = saveFile.uri;
      openDefaultModal({
        title: 'Exported Address Book',
        msg: `Address book exported successfully. You can find the file at: ${path}`,
      });
    } else {
      a.download = filename;
      a.href = href;
      a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
      a.click();
    }
  }

  function importAddressBook() {
    const { open, onChange } = useFileDialog({
      accept: '.json',
      multiple: false,
      reset: true,
    });
    open();
    onChange((files) => {
      if (!files?.length) return;
      const file = files[0];
      file.text().then((json) => {
        addAddressBookEntriesFromJson(json);
      });
    });
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
