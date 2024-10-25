import {
  computed,
  ref,
  watch,
} from 'vue';

import type {
  IAccountSelectorEntry,
  ITransaction,
} from '@/types';
import {
  ACCOUNT_SELECT_TYPE_FILTER,
  AccountSelectTypeFilter,
  PROTOCOLS,
  TX_DIRECTION,
} from '@/constants';
import {
  createCustomScopedComposable,
  excludeFalsy,
  getDefaultAccountLabel,
} from '@/utils';
import {
  useAccounts,
  useAddressBook,
  useLatestTransactionList,
} from '@/composables';

import { useAeNames } from '@/protocols/aeternity/composables/aeNames';
import {
  getInnerTransaction,
  getOwnershipStatus,
  getTxDirection,
  getTxOwnerAddress,
} from '@/protocols/aeternity/helpers';

import { tg } from '@/popup/plugins/i18n';
import { AE_TRANSACTION_OWNERSHIP_STATUS } from '@/protocols/aeternity/config';
import { Encoding, isAddressValid } from '@aeternity/aepp-sdk';

export const useAccountSelector = createCustomScopedComposable(() => {
  const { getName, ownedNames } = useAeNames();

  const searchQuery = ref('');
  const {
    addressBookFiltered,
    addressBookFilteredByProtocol,
    protocolFilter,
    showBookmarked,
    getAddressBookEntryByAddress,
    setProtocolFilter,
    setShowBookmarked,
    clearFilters: addressBookClearFilters,
  } = useAddressBook();
  const {
    activeAccount,
    accounts,
    accountsGroupedByProtocol,
    getAccountByAddress,
  } = useAccounts();
  const { accountsTransactionsLatest } = useLatestTransactionList();
  const accountSelectType = ref<AccountSelectTypeFilter>(ACCOUNT_SELECT_TYPE_FILTER.addressBook);

  const latestTransactions = computed(
    () => (accountsTransactionsLatest.value[activeAccount.value.address] || [])
      .map((transaction: ITransaction): IAccountSelectorEntry | null => {
        const outerTx = transaction.tx!;
        const innerTx = transaction.tx ? getInnerTransaction(transaction.tx) : null;
        const { recipientId } = outerTx?.payerId ? outerTx : innerTx;
        const direction = getTxDirection(
          outerTx?.payerId ? outerTx : innerTx,
          (
            getOwnershipStatus(activeAccount.value, accounts.value, innerTx)
              !== AE_TRANSACTION_OWNERSHIP_STATUS.current
            && getTxOwnerAddress(innerTx)
          ) || activeAccount.value.address,
        );
        if (direction !== TX_DIRECTION.sent || !recipientId) {
          return null;
        }

        const addressBookRecord = getAddressBookEntryByAddress(recipientId);
        if (addressBookRecord) {
          return addressBookRecord;
        }

        let name = tg('modals.send.recipientLabel');
        let localChainNameAddress: string | undefined;
        const isSentToChainName = isAddressValid(recipientId, Encoding.Name);

        if (isSentToChainName) {
          const ownedName = ownedNames.value.find((entry) => entry.hash === recipientId);
          if (ownedName) {
            name = ownedName.name;
            localChainNameAddress = ownedName.pointers.accountPubkey;
          }
        } else {
          const account = getAccountByAddress(recipientId!);
          if (account) {
            name = getName(account.address).value || getDefaultAccountLabel(account);
          } else {
            name = getName(recipientId).value || name;
          }
        }

        return {
          name,
          address: isSentToChainName ? localChainNameAddress : recipientId,
          nameAddress: (localChainNameAddress || !isSentToChainName) ? undefined : recipientId,
          isBookmarked: false,
          protocol: protocolFilter.value ?? PROTOCOLS.aeternity,
        };
      })
      .filter(excludeFalsy),
  );
  const ownAddresses = computed(
    () => (protocolFilter.value)
      ? (accountsGroupedByProtocol.value[protocolFilter.value] ?? []).map((account) => (
        {
          name: getName(account.address).value || getDefaultAccountLabel(account),
          address: account.address,
          isBookmarked: false,
          protocol: protocolFilter.value ?? PROTOCOLS.aeternity,
          type: account.type,
        }
      ))
      : [],
  );
  const accountsFilteredByType = computed(() => {
    switch (accountSelectType.value) {
      case ACCOUNT_SELECT_TYPE_FILTER.bookmarked:
      case ACCOUNT_SELECT_TYPE_FILTER.addressBook:
        return addressBookFiltered.value;
      case ACCOUNT_SELECT_TYPE_FILTER.recent:
        return latestTransactions.value;
      case ACCOUNT_SELECT_TYPE_FILTER.owned:
        return ownAddresses.value;
      case ACCOUNT_SELECT_TYPE_FILTER.all:
        return [...addressBookFiltered.value, ...ownAddresses.value];
      default:
        return [];
    }
  });
  const accountsFiltered = computed(() => {
    const entries: IAccountSelectorEntry[] = accountsFilteredByType.value ?? [];
    const searchQueryLower = searchQuery.value.toLowerCase();

    return entries
      .filter( // Filter by searchQuery
        ({ name, address }) => [name, address].some(
          (val) => val.toLowerCase().includes(searchQueryLower),
        ),
      ).filter( // Remove duplicates
        (entry, index, self) => self.findIndex(
          (e) => (
            (e.address !== undefined && e.address === entry.address)
            || (e.address === undefined && e.nameAddress === entry.nameAddress)
          ),
        ) === index,
      ).map( // Add flag for own addresses
        (entry) => ({
          ...entry,
          isOwnAddress: ownAddresses.value.some(
            (account) => account.address === entry.address,
          ),
        }),
      );
  });

  function setAccountSelectType(type: AccountSelectTypeFilter, resetProtocolFilter = false) {
    accountSelectType.value = type;
    setShowBookmarked(type === ACCOUNT_SELECT_TYPE_FILTER.bookmarked, resetProtocolFilter);
  }
  function clearFilters(resetProtocolFilter = false) {
    accountSelectType.value = ACCOUNT_SELECT_TYPE_FILTER.addressBook;
    addressBookClearFilters(resetProtocolFilter);
  }

  watch(
    protocolFilter,
    () => {
      if (protocolFilter.value) {
        setAccountSelectType(ACCOUNT_SELECT_TYPE_FILTER.addressBook);
      }
    },
  );

  // Storing the previous type in order to revert to it when the input is cleared
  let savedPrevAccountSelectType = false;
  let prevAccountSelectType = accountSelectType.value;
  watch(searchQuery, (newSearch) => {
    if (newSearch !== '' && !savedPrevAccountSelectType) {
      savedPrevAccountSelectType = true;
      prevAccountSelectType = accountSelectType.value;
      accountSelectType.value = ACCOUNT_SELECT_TYPE_FILTER.all;
    } else if (newSearch === '') {
      savedPrevAccountSelectType = false;
      accountSelectType.value = prevAccountSelectType;
    }
  });

  return {
    accountSelectType,
    accountsFiltered,
    addressBookFilteredByProtocol,
    protocolFilter,
    showBookmarked,
    searchQuery,

    setAccountSelectType,
    setProtocolFilter,
    setShowBookmarked,
    clearFilters,
  };
});
