import { computed, ref, watch } from 'vue';

import {
  AccountAddress,
  IAddressBookEntry,
  Protocol,
} from '@/types';
import { STORAGE_KEYS, MODAL_ADDRESS_BOOK_IMPORT } from '@/constants';
import { AddressBookEntryExists, AddressBookInvalidAddress, AddressBookRequiredFields } from '@/lib/errors';
import {
  createCustomScopedComposable,
  getProtocolByAddress,
  handleUnknownError,
  selectFiles,
  pipe,
  exportFile,
  isEvm,
} from '@/utils';
import { tg as t } from '@/popup/plugins/i18n';

import { useStorageRef } from './storageRef';
import { useModals } from './modals';

interface IAddressBookOptions {
  name: string;
  address: AccountAddress;
  isBookmarked?: boolean;
}

const addressBook = useStorageRef<IAddressBookEntry[]>([], STORAGE_KEYS.addressBook);

export const useAddressBook = createCustomScopedComposable(() => {
  const { openModal, openDefaultModal } = useModals();

  const protocolFilter = ref<Protocol | null>(null);
  const searchQuery = ref('');
  const showBookmarked = ref(false);

  function filterAddressBookByBookmarked(entries: IAddressBookEntry[]) {
    return showBookmarked.value ? entries.filter((entry) => entry.isBookmarked) : entries;
  }
  function filterAddressBookByProtocol(entries: IAddressBookEntry[]) {
    if (!protocolFilter.value) return entries;

    const protocol = protocolFilter.value;
    if (isEvm(protocol)) {
      return entries.filter((e) => isEvm(e.protocol));
    }
    return entries.filter((e) => e.protocol === protocol);
  }
  function filterAddressBookBySearchPhrase(entries: IAddressBookEntry[]) {
    const searchQueryLower = searchQuery.value.toLowerCase();
    return entries.filter(({ name, address }) => (
      [name, address].some((val) => val.toLowerCase().includes(searchQueryLower))
    ));
  }
  function sortAddressBookByName(entries: IAddressBookEntry[]) {
    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }

  const addressBookFiltered = computed(
    () => pipe([
      filterAddressBookByBookmarked,
      filterAddressBookByProtocol,
      filterAddressBookBySearchPhrase,
      sortAddressBookByName,
    ])(Object.values(addressBook.value)),
  );

  const addressBookFilteredByProtocol = computed(
    () => filterAddressBookByProtocol(Object.values(addressBook.value)),
  );

  function setProtocolFilter(filter: Protocol | null) {
    showBookmarked.value = false;
    protocolFilter.value = filter;
  }

  function setShowBookmarked(value: boolean, resetProtocolFilter = false) {
    if (resetProtocolFilter) {
      protocolFilter.value = null;
    }
    showBookmarked.value = value;
  }

  function clearFilters(resetProtocolFilter = false) {
    showBookmarked.value = false;
    if (resetProtocolFilter) {
      protocolFilter.value = null;
    }
  }

  function getAddressBookEntryByAddress(address?: AccountAddress) {
    return addressBook.value?.find((entry) => entry.address === address);
  }

  function removeAddressBookEntry(address: AccountAddress) {
    addressBook.value = addressBook.value.filter((entry) => entry.address !== address);
  }

  function toggleBookmarkAddressBookEntry(address: AccountAddress) {
    const entry = getAddressBookEntryByAddress(address);
    if (entry) {
      entry.isBookmarked = !entry.isBookmarked;
    }
  }

  /**
   * Add or edit an address book entry
   * Passing a savedEntryAddress will update the entry instead of adding a new one
   */
  function addAddressBookEntry(
    { name, address, isBookmarked }: IAddressBookOptions,
    savedEntryAddress?: AccountAddress,
  ) {
    if (!name || !address) {
      throw new AddressBookRequiredFields();
    }

    if (!savedEntryAddress && !!getAddressBookEntryByAddress(address)) {
      throw new AddressBookEntryExists();
    }

    const protocol = getProtocolByAddress(address);
    if (!protocol) {
      throw new AddressBookInvalidAddress();
    }
    const savedEntry = getAddressBookEntryByAddress(savedEntryAddress!);

    const defaultIsBookmarked = !!savedEntry?.isBookmarked;

    const entry = {
      name,
      address,
      protocol,
      isBookmarked: isBookmarked || defaultIsBookmarked,
    };

    if (!savedEntry) {
      addressBook.value.push(entry);
      return;
    }
    Object.assign(savedEntry, entry);
  }

  function addAddressBookEntriesFromJson(json: string) {
    try {
      const newEntries: IAddressBookEntry[] = JSON.parse(json);
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

      openModal(MODAL_ADDRESS_BOOK_IMPORT, {
        totalEntries,
        successfulEntriesCount,
        existingEntriesCount,
      });
    } catch (error) {
      handleUnknownError(error);
    }
  }

  async function exportAddressBook() {
    await exportFile(
      JSON.stringify(addressBook.value),
      'addressBookExport.json',
    );
    openDefaultModal({
      title: t('pages.addressBook.export.title'),
      msg: t('pages.addressBook.export.message'),
    });
  }

  async function importAddressBook() {
    try {
      const files = await selectFiles({ accept: '.json' });
      files?.[0]?.text().then((json) => addAddressBookEntriesFromJson(json));
    } catch (e) {
      /** NOOP */
    }
  }

  // If user is on bookmarked filter and tries to search, switch to all filter
  watch(searchQuery, (newSearch) => {
    if (newSearch && showBookmarked.value) {
      clearFilters();
    }
  });

  return {
    protocolFilter,
    addressBook,
    addressBookFiltered,
    addressBookFilteredByProtocol,
    showBookmarked,
    searchQuery,

    setProtocolFilter,
    setShowBookmarked,
    clearFilters,
    addAddressBookEntry,
    removeAddressBookEntry,
    getAddressBookEntryByAddress,
    toggleBookmarkAddressBookEntry,
    exportAddressBook,
    importAddressBook,
  };
});
