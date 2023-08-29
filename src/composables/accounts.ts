import {
  computed,
  ref,
} from 'vue';
import { uniq } from 'lodash-es';
import { Encoded } from '@aeternity/aepp-sdk';
import type {
  IAccount,
  IAccountRaw,
  IDefaultComposableOptions,
  IFormSelectOption,
  Protocol,
  ProtocolRecord,
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
import { useStorageRef } from './composablesHelpers';

let isIdxInitialized = false;
const protocolNextAccountIdx = ref<ProtocolRecord<number>>(
  // Aeternity starts from 1 as we have 1 account as default
  PROTOCOLS.reduce((acc, protocol) => ({ ...acc, [protocol]: 0, [PROTOCOL_AETERNITY]: 1 }), {}),
);
const protocolLastActiveGlobalIdx = useStorageRef<ProtocolRecord<number>>({}, 'protocol-last-active-account-idx');

/**
 * TODO in the future the state of the accounts should be stored in this composable
 */
export function useAccounts({ store }: IDefaultComposableOptions) {
  const activeIdx = computed((): number => store.state.accounts?.activeIdx || 0);
  const accountsRaw = computed((): IAccountRaw[] => store.state.accounts?.list || []);
  const accounts = computed((): IAccount[] => store.getters.accounts || []);
  const accountsGroupedByProtocol = computed(
    () => accounts.value.reduce(
      (acc, account) => ({
        ...acc,
        [account.protocol]: [...(acc?.[account.protocol] || []), account],
      }),
      {} as ProtocolRecord<IAccount[]>,
    ),
  );
  const aeAccounts = computed(
    (): IAccount[] => accountsGroupedByProtocol.value[PROTOCOL_AETERNITY] || [],
  );

  const accountsAddressList = computed(() => accounts.value.map((acc) => acc.address));

  const activeAccount = computed((): IAccount => accounts.value[activeIdx.value] || {});

  const isLoggedIn = computed(
    (): boolean => activeAccount.value && Object.keys(activeAccount.value).length > 0,
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
      globalIdx: acc.globalIdx,
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

  function getAccountByGlobalIdx(globalIdx: number): IAccount | undefined {
    return accounts.value.find((acc) => acc.globalIdx === globalIdx);
  }

  function setActiveAccountByGlobalIdx(globalIdx: number = 0) {
    const account = getAccountByGlobalIdx(globalIdx);

    // TODO replace with updating local state after removing the Vuex
    store.commit('accounts/setActiveIdx', account?.globalIdx || 0);

    if (account) {
      protocolLastActiveGlobalIdx.value[account.protocol] = account.globalIdx;
    }
  }

  function setActiveAccountByAddress(address?: Encoded.AccountAddress) {
    if (address) {
      setActiveAccountByGlobalIdx(getAccountByAddress(address)?.globalIdx);
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
      protocolNextAccountIdx.value[protocol]! += 1;
    }
  }

  function setProtocolNextAccountIdx(value: number, protocol: Protocol) {
    protocolNextAccountIdx.value[protocol] = value;
  }

  /**
   * Access last used (or current) account of the protocol when accessing features
   * related to protocol different than the current account is using.
   */
  function getLastActiveProtocolAccount(protocol: Protocol): IAccount | undefined {
    if (activeAccount.value.protocol === protocol) {
      return activeAccount.value;
    }
    const lastUsedGlobalIdx = protocolLastActiveGlobalIdx.value[protocol];
    return (lastUsedGlobalIdx)
      ? getAccountByGlobalIdx(lastUsedGlobalIdx)
      : accounts.value.find((account) => account.protocol === protocol);
  }

  (async () => {
    if (!isIdxInitialized) {
      await watchUntilTruthy(() => store.state.isRestored);
      Object.entries(accountsGroupedByProtocol.value).forEach(([protocol, protocolAccounts]) => {
        setProtocolNextAccountIdx(protocolAccounts?.length || 0, protocol as Protocol);
      });

      isIdxInitialized = true;

      protocolLastActiveGlobalIdx
        .value[activeAccount.value.protocol] = activeAccount.value.globalIdx;
    }
  })();

  return {
    accounts,
    aeAccounts,
    accountsAddressList,
    accountsSelectOptions,
    aeAccountsSelectOptions,
    accountsRaw,
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
    getAccountByGlobalIdx,
    getLastActiveProtocolAccount,
    setActiveAccountByAddress,
    setActiveAccountByGlobalIdx,
  };
}
