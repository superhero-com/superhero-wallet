import {
  computed,
  ref,
} from 'vue';
import { uniq } from 'lodash-es';
import { Encoded } from '@aeternity/aepp-sdk';
import type {
  IAccount,
  IDefaultComposableOptions,
  IFormSelectOption,
  Protocol,
} from '@/types';
import {
  PROTOCOL_AETERNITY,
  PROTOCOLS,
} from '@/constants';
import {
  getAccountNameToDisplay,
  watchUntilTruthy,
} from '@/utils';
import { AE_FAUCET_URL } from '@/protocols/aeternity/config';
import { buildSimplexLink } from '@/protocols/aeternity/helpers';

const isIdxInitialized = ref(false);
const protocolNextAccountIdx = ref<Partial<Record<Protocol, number>>>(
  // Aeternity starts from 1 as we have 1 account as default
  PROTOCOLS.reduce((acc, protocol) => ({ ...acc, [protocol]: 0, [PROTOCOL_AETERNITY]: 1 }), {}),
);

export function useAccounts({ store }: IDefaultComposableOptions) {
  // TODO in the future the state of the accounts should be stored in this composable
  const activeIdx = computed((): number => store.state.accounts?.activeIdx || 0);
  const accounts = computed((): IAccount[] => store.getters.accounts || []);
  const aeAccounts = computed(
    (): IAccount[] => accounts.value.filter(({ protocol }) => protocol === PROTOCOL_AETERNITY),
  );
  const protocolGroupedAccounts = computed(
    (): Partial<Record<Protocol, IAccount[]>> => accounts.value.reduce(
      (acc, account) => ({
        ...acc,
        // @ts-ignore
        [account.protocol]: [...(acc?.[account.protocol] || []), account],
      }),
      {},
    ),
  );

  const accountsAddressList = computed(() => accounts.value.map((acc) => acc.address));

  const activeAccount = computed((): IAccount => accounts.value[activeIdx.value] || {});

  const isLoggedIn = computed(
    () => activeAccount.value && Object.keys(activeAccount.value).length > 0,
  );
  const aeNextAccountIdx = computed(
    (): number => protocolNextAccountIdx.value[PROTOCOL_AETERNITY] || 0,
  );
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
      protocol: acc.protocol || PROTOCOL_AETERNITY,
      globalIndex: acc.globalIndex,
    }));
  }

  const accountsSelectOptions = computed(() => prepareAccountSelectOptions(accounts.value));
  const aeAccountsSelectOptions = computed(() => prepareAccountSelectOptions(aeAccounts.value));

  const activeAccountSimplexLink = computed(() => buildSimplexLink(activeAccount.value.address));

  const activeAccountFaucetUrl = computed(() => `${AE_FAUCET_URL}?address=${activeAccount.value.address}`);

  const protocolsInUse = computed(
    (): Protocol[] => uniq(accounts.value.map((account) => account.protocol)),
  );

  function getAccountByAddress(address: Encoded.AccountAddress): IAccount | undefined {
    return accounts.value.find((acc) => acc.address === address);
  }

  function setActiveAccountByIdx(idx: number = 0) {
    // TODO replace with updating local state after removing the Vuex
    store.commit('accounts/setActiveIdx', +(accounts.value[idx].globalIndex || 0));
  }

  function setActiveAccountByAddress(address?: Encoded.AccountAddress) {
    if (address) {
      setActiveAccountByIdx(getAccountByAddress(address)?.globalIndex);
    }
  }

  /**
   * Determine if provided address belongs to any of the current user's accounts.
   */
  function isLocalAccountAddress(address: Encoded.AccountAddress): boolean {
    return accountsAddressList.value.includes(address);
  }

  function incrementProtocolNextAccountIdx(protocol: Protocol) {
    if (protocolNextAccountIdx.value[protocol] === undefined) {
      protocolNextAccountIdx.value[protocol] = 0;
    } else {
      // @ts-ignore
      protocolNextAccountIdx.value[protocol] += 1;
    }
  }

  function setProtocolNextAccountIdx(value: number, protocol: Protocol) {
    protocolNextAccountIdx.value[protocol] = value;
  }

  (async () => {
    if (!isIdxInitialized.value) {
      await watchUntilTruthy(() => store.state.isRestored);
      Object.entries(protocolGroupedAccounts.value).forEach(([protocol, protocolAccounts]) => {
        setProtocolNextAccountIdx(protocolAccounts?.length || 0, protocol as Protocol);
      });
      isIdxInitialized.value = true;
    }
  })();

  return {
    accounts,
    aeAccounts,
    accountsAddressList,
    accountsSelectOptions,
    aeAccountsSelectOptions,
    aeNextAccountIdx,
    activeAccount,
    activeAccountSimplexLink,
    activeAccountFaucetUrl,
    activeIdx,
    isLoggedIn,
    protocolsInUse,
    protocolNextAccountIdx,
    incrementProtocolNextAccountIdx,
    prepareAccountSelectOptions,
    isLocalAccountAddress,
    getAccountByAddress,
    setActiveAccountByAddress,
    setActiveAccountByIdx,
  };
}
