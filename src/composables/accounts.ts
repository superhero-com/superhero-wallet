import { computed } from 'vue';
import { Encoded } from '@aeternity/aepp-sdk-13';
import { useI18n } from 'vue-i18n';
import type {
  IAccount,
  IAccountOverview,
  IDefaultComposableOptions,
  IFormSelectOption,
  INetwork,
} from '../types';
import { FAUCET_URL, buildSimplexLink, getAccountNameToDisplay } from '../popup/utils';
import { AeScan } from '../lib/AeScan';

export function useAccounts({ store }: IDefaultComposableOptions) {
  const { t } = useI18n();

  // TODO in the future the state of the accounts should be stored in this composable
  const activeIdx = computed((): number => store.state.accounts?.activeIdx || 0);
  const accounts = computed((): IAccount[] => store.getters.accounts || []);
  const accountsAddressList = computed(() => accounts.value.map((acc) => acc.address));
  const activeAccount = computed((): IAccount => accounts.value[activeIdx.value] || {});
  const isLoggedIn = computed(
    () => activeAccount.value && Object.keys(activeAccount.value).length > 0,
  );
  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

  /**
   * Accounts data formatted as the form select options
   */
  function prepareAccountSelectOptions(accountList: IAccount[]): IFormSelectOption[] {
    return accountList.map((acc) => ({
      text: getAccountNameToDisplay(acc),
      value: acc.address,
      address: acc.address,
      name: acc.name,
      idx: acc.idx,
    }));
  }

  const activeAccountExtended = computed((): IAccountOverview => ({
    ...activeAccount.value,
    label: t('transaction.overview.accountAddress'),
    url: (new AeScan(activeNetwork.value.explorerUrl))
      .prepareUrlForAccount(activeAccount.value.address),
  }));

  const accountsSelectOptions = computed(() => prepareAccountSelectOptions(accounts.value));

  const activeAccountSimplexLink = computed(() => buildSimplexLink(activeAccount.value.address));

  const activeAccountFaucetUrl = computed(() => `${FAUCET_URL}?address=${activeAccount.value.address}`);

  function getAccountByAddress(address: Encoded.AccountAddress): IAccount | undefined {
    return accounts.value.find((acc) => acc.address === address);
  }

  function setActiveAccountByIdx(idx: number = 0) {
    // TODO replace with updating local state after removing the Vuex
    store.commit('accounts/setActiveIdx', +(accounts.value[idx].idx || 0));
  }

  function setActiveAccountByAddress(address?: Encoded.AccountAddress) {
    if (address) {
      setActiveAccountByIdx(getAccountByAddress(address)?.idx);
    }
  }

  /**
   * Determine if provided address belongs to any of the current user's accounts.
   */
  function isLocalAccountAddress(address: Encoded.AccountAddress): boolean {
    return accountsAddressList.value.includes(address);
  }

  return {
    accounts,
    accountsAddressList,
    accountsSelectOptions,
    activeAccount,
    activeAccountExtended,
    activeAccountSimplexLink,
    activeAccountFaucetUrl,
    activeIdx,
    isLoggedIn,
    prepareAccountSelectOptions,
    isLocalAccountAddress,
    getAccountByAddress,
    setActiveAccountByAddress,
    setActiveAccountByIdx,
  };
}
