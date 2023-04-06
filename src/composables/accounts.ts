import { computed } from 'vue';
import type { IAccount, IDefaultComposableOptions, IFormSelectOption } from '../types';
import { getAccountNameToDisplay } from '../popup/utils';

export function useAccounts({ store }: IDefaultComposableOptions) {
  // TODO in th future the state of the accounts should be stored in this composable
  const accounts = computed((): IAccount[] => store.getters.accounts);
  const account = computed((): IAccount => store.getters.account);
  const accountsAddressList = computed(() => accounts.value.map((acc) => acc.address));

  /**
   * Accounts data formatted as the form select options
   */
  const accountsSelectOptions = computed(
    (): IFormSelectOption[] => accounts.value.map((acc) => ({
      text: getAccountNameToDisplay(acc),
      value: acc.address,
      address: acc.address,
    })),
  );

  /**
   * Determine if provided address belongs to any of the current user's accounts.
   */
  function isLocalAccountAddress(address: string): boolean {
    return accountsAddressList.value.includes(address);
  }

  return {
    accounts,
    account,
    accountsAddressList,
    accountsSelectOptions,
    isLocalAccountAddress,
  };
}
