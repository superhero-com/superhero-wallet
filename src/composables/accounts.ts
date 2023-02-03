import { computed } from '@vue/composition-api';
import { Store } from 'vuex';
import { IAccount } from '../types';

interface UseMultisigAccountsOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
}

export function useAccounts({ store }: UseMultisigAccountsOptions) {
  // TODO in th future the state of the accounts should be stored in this composable
  const accounts = computed((): IAccount[] => store.getters.accounts);
  const accountsAddressList = computed(() => accounts.value.map((acc) => acc.address));

  /**
   * Determine if provided address belongs to any of the current user's accounts.
   */
  function isLocalAccountAddress(address: string): boolean {
    return accountsAddressList.value.includes(address);
  }

  return {
    accounts,
    accountsAddressList,
    isLocalAccountAddress,
  };
}
