import { computed, ref } from 'vue';
import { uniq } from 'lodash-es';
import { Encoded } from '@aeternity/aepp-sdk';
import { generateMnemonic, mnemonicToSeed } from '@aeternity/bip39';
import type {
  IAccount,
  IAccountRaw,
  IFormSelectOption,
  Protocol,
  ProtocolRecord,
} from '@/types';
import {
  ACCOUNT_HD_WALLET,
  PROTOCOL_AETERNITY,
  PROTOCOLS,
  STORAGE_KEYS,
  RUNNING_IN_TESTS,
} from '@/constants';
import {
  prepareAccountSelectOptions,
  watchUntilTruthy,
} from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import migrateAccountsVuexToComposable from '@/migrations/001-accounts-vuex-to-composable';
import migrateMnemonicVuexToComposable from '@/migrations/002-mnemonic-vuex-to-composable';
import migrateMnemonicCordovaToIonic from '@/migrations/008-mnemonic-cordova-to-ionic';
import { useStorageRef } from './storageRef';

let isInitialized = false;

const areAccountsRestored = ref(false);

/**
 * TODO Implement more safe way of storing mnemonic
 * For example by encrypting it with password or pin code.
 */
const mnemonic = useStorageRef<string>(
  '',
  STORAGE_KEYS.mnemonic,
  {
    backgroundSync: true,
    migrations: RUNNING_IN_TESTS ? [
      migrateMnemonicVuexToComposable,
    ] : [
      migrateMnemonicVuexToComposable,
      migrateMnemonicCordovaToIonic,
    ],
  },
);

const accountsRaw = useStorageRef<IAccountRaw[]>(
  [],
  STORAGE_KEYS.accountsRaw,
  {
    backgroundSync: true,
    migrations: [
      migrateAccountsVuexToComposable,
    ],
    onRestored: () => {
      areAccountsRestored.value = true;
    },
  },
);

const activeAccountGlobalIdx = useStorageRef<number>(
  0,
  STORAGE_KEYS.activeAccountGlobalIdx,
  { backgroundSync: true },
);

const protocolLastActiveGlobalIdx = useStorageRef<ProtocolRecord<number>>(
  {},
  STORAGE_KEYS.protocolLastActiveAccountIdx,
  { backgroundSync: true },
);

const mnemonicSeed = computed(() => mnemonic.value ? mnemonicToSeed(mnemonic.value) : null);

const accounts = computed((): IAccount[] => {
  if (!mnemonic.value || !accountsRaw.value?.length) {
    return [];
  }

  const idxList = Object.fromEntries(PROTOCOLS.map(((protocol) => [protocol, 0])));

  return accountsRaw.value
    .map((account, globalIdx) => {
      const idx = idxList[account.protocol];
      const hdWallet = ProtocolAdapterFactory
        .getAdapter(account.protocol)
        // Type `any` here is used only to satisfy the account address type differences
        // TODO remove `any` when IAccount.address will be set to `string`.
        .getHdWalletAccountFromMnemonicSeed(mnemonicSeed.value, idx) as any;

      idxList[account.protocol] += 1;

      return {
        globalIdx,
        idx,
        ...account,
        ...hdWallet,
      };
    });
});

const activeAccount = computed((): IAccount => accounts.value[activeAccountGlobalIdx.value] || {});

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

const accountsAddressList = computed(
  (): string[] => accounts.value.map(({ address }) => address),
);

const accountsSelectOptions = computed(
  (): IFormSelectOption[] => prepareAccountSelectOptions(accounts.value),
);

const aeAccountsSelectOptions = computed(
  (): IFormSelectOption[] => prepareAccountSelectOptions(aeAccounts.value),
);

const isLoggedIn = computed(
  (): boolean => activeAccount.value && Object.keys(activeAccount.value).length > 0,
);

const protocolsInUse = computed(
  (): Protocol[] => uniq(accounts.value.map(({ protocol }) => protocol)),
);

/**
 * Composable that handles all operations related to the accounts.
 * The app is storing only basic account data in the browser storage.
 * The wallets's data is created in fly with the use of computed properties.
 */
export function useAccounts() {
  function getAccountByAddress(address: Encoded.AccountAddress): IAccount | undefined {
    return accounts.value.find((acc) => acc.address === address);
  }

  function getAccountByGlobalIdx(globalIdx: number): IAccount | undefined {
    return accounts.value.find((acc) => acc.globalIdx === globalIdx);
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

  function getLastProtocolAccount(protocol: Protocol): IAccount | undefined {
    const protocolAccounts = accountsGroupedByProtocol.value[protocol];
    return (protocolAccounts)
      ? protocolAccounts[protocolAccounts.length - 1]
      : undefined;
  }

  function setActiveAccountByGlobalIdx(globalIdx: number = 0) {
    const account = getAccountByGlobalIdx(globalIdx);
    activeAccountGlobalIdx.value = account?.globalIdx || 0;
    if (account) {
      protocolLastActiveGlobalIdx.value[account.protocol] = account.globalIdx;
    }
  }

  function setActiveAccountByAddress(address?: Encoded.AccountAddress) {
    if (address) {
      setActiveAccountByGlobalIdx(getAccountByAddress(address)?.globalIdx);
    }
  }

  function setActiveAccountByProtocolAndIdx(protocol: Protocol, idx: number) {
    const accountFound = accountsGroupedByProtocol.value[protocol]
      ?.find((account) => account.idx === idx);
    if (accountFound) {
      setActiveAccountByGlobalIdx(accountFound.globalIdx);
    }
  }

  function setActiveAccountByProtocol(protocol: Protocol) {
    const account = getLastActiveProtocolAccount(protocol);
    setActiveAccountByProtocolAndIdx(protocol, account?.idx || 0);
  }

  function setMnemonic(newMnemonic: string) {
    mnemonic.value = newMnemonic;
  }

  function setGeneratedMnemonic() {
    setMnemonic(generateMnemonic());
  }

  /**
   * Determine if provided address belongs to any of the current user's accounts.
   */
  function isLocalAccountAddress(address: Encoded.AccountAddress): boolean {
    return accountsAddressList.value.includes(address);
  }

  function addRawAccount({
    isRestored,
    protocol,
  }: Omit<IAccountRaw, 'type'>): number {
    accountsRaw.value.push({
      protocol,
      isRestored,
      type: ACCOUNT_HD_WALLET,
    });
    return getLastProtocolAccount(protocol)?.idx || 0;
  }

  /**
   * Establish the last used account index under the actual seed phrase for each of the protocols
   * and collect the raw accounts so they can be stored in the browser storage.
   */
  async function discoverAccounts() {
    const lastUsedAccountIndexRegistry: number[] = await Promise.all(
      PROTOCOLS.map(
        (protocol) => ProtocolAdapterFactory
          .getAdapter(protocol)
          .discoverLastUsedAccountIndex(mnemonicSeed.value),
      ),
    );

    PROTOCOLS.forEach((protocol, index) => {
      for (let i = 0; i <= lastUsedAccountIndexRegistry[index]; i += 1) {
        addRawAccount({ isRestored: true, protocol });
      }
    });
  }

  function resetAccounts() {
    mnemonic.value = '';
    accountsRaw.value = [];
    activeAccountGlobalIdx.value = 0;
  }

  (async () => {
    if (!isInitialized) {
      await watchUntilTruthy(isLoggedIn);

      isInitialized = true;

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
    activeAccount,
    activeAccountGlobalIdx,
    areAccountsRestored,
    isLoggedIn,
    mnemonic,
    mnemonicSeed,
    protocolsInUse,
    discoverAccounts,
    isLocalAccountAddress,
    addRawAccount,
    getAccountByAddress,
    getAccountByGlobalIdx,
    getLastActiveProtocolAccount,
    setActiveAccountByAddress,
    setActiveAccountByGlobalIdx,
    setActiveAccountByProtocolAndIdx,
    setActiveAccountByProtocol,
    setMnemonic,
    setGeneratedMnemonic,
    resetAccounts,
  };
}
