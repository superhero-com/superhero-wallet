import { computed } from 'vue';
import { uniq } from 'lodash-es';
import { Encoded } from '@aeternity/aepp-sdk';
import { generateMnemonic, mnemonicToSeed } from '@aeternity/bip39';
import type {
  IAccount,
  IAccountRaw,
  IDefaultComposableOptions,
  IFormSelectOption,
  Protocol,
  ProtocolRecord,
} from '@/types';
import {
  ACCOUNT_HD_WALLET,
  PROTOCOL_AETERNITY,
  PROTOCOLS,
} from '@/constants';
import {
  getDefaultAccountLabel,
  watchUntilTruthy,
} from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { AE_FAUCET_URL } from '@/protocols/aeternity/config';
import { buildSimplexLink } from '@/protocols/aeternity/helpers';
import { useStorageRef } from './composablesHelpers';

let isIdxInitialized = false;

/**
 * TODO Implement more safe way of storing mnemonic
 */
const mnemonic = useStorageRef<string>('', 'mnemonic');
const accountsRaw = useStorageRef<IAccountRaw[]>([], 'accounts-raw');
const activeAccountGlobalIdx = useStorageRef<number>(0, 'active-account-global-idx');
const protocolLastActiveGlobalIdx = useStorageRef<ProtocolRecord<number>>({}, 'protocol-last-active-account-idx');

const mnemonicSeed = computed(() => mnemonic.value ? mnemonicToSeed(mnemonic.value) : null);

const accounts = computed((): IAccount[] => {
  if (!mnemonic.value || !accountsRaw.value.length) {
    return [];
  }

  return accountsRaw.value
    .map((account, index) => {
      const hdWallet = ProtocolAdapterFactory
        .getAdapter(account.protocol)
        .getHdWalletAccountFromMnemonicSeed(mnemonicSeed.value, account.idx) as any;

      return {
        globalIdx: index,
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

const isLoggedIn = computed(
  (): boolean => activeAccount.value && Object.keys(activeAccount.value).length > 0,
);

const activeAccountSimplexLink = computed(
  () => buildSimplexLink(activeAccount.value.address),
);

const activeAccountFaucetUrl = computed(
  () => `${AE_FAUCET_URL}?address=${activeAccount.value.address}`,
);

const protocolsInUse = computed(
  (): Protocol[] => uniq(accounts.value.map(({ protocol }) => protocol)),
);

/**
 * Composable that handles all operations related to the accounts.
 * The app is storing only basic account data in the browser storage.
 * The wallets's data is created in fly with the use of computed properties.
 */
export function useAccounts({ store }: IDefaultComposableOptions) {
  const getDefaultName = store.getters['names/getDefault'] as (a?: string) => string | undefined;

  const activeAccountName = computed(() => getDefaultName(activeAccount.value.address));

  /**
   * Accounts data formatted as the form select options
   */
  function prepareAccountSelectOptions(accountList: IAccount[]): IFormSelectOption[] {
    return accountList.map((acc) => ({
      text: getDefaultName(acc.address) || getDefaultAccountLabel(acc),
      value: acc.address,
      address: acc.address,
      idx: acc.idx,
      protocol: acc.protocol || PROTOCOL_AETERNITY,
      globalIdx: acc.globalIdx,
    }));
  }

  const accountsSelectOptions = computed(() => prepareAccountSelectOptions(accounts.value));

  const aeAccountsSelectOptions = computed(() => prepareAccountSelectOptions(aeAccounts.value));

  function setMnemonic(val: string) {
    mnemonic.value = val;
  }

  function setGeneratedMnemonic() {
    setMnemonic(generateMnemonic());
  }

  function getAccountByAddress(address: Encoded.AccountAddress): IAccount | undefined {
    return accounts.value.find((acc) => acc.address === address);
  }

  function getAccountByGlobalIdx(globalIdx: number): IAccount | undefined {
    return accounts.value.find((acc) => acc.globalIdx === globalIdx);
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

  /**
   * Determine if provided address belongs to any of the current user's accounts.
   */
  function isLocalAccountAddress(address: Encoded.AccountAddress): boolean {
    return accountsAddressList.value.includes(address);
  }

  function getLastProtocolAccount(protocol: Protocol): IAccount | undefined {
    const protocolAccounts = accountsGroupedByProtocol.value[protocol];
    return protocolAccounts
      ? protocolAccounts[protocolAccounts.length - 1]
      : undefined;
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

  function addRawAccount({
    isRestored,
    protocol,
  }: Omit<IAccountRaw, 'type' | 'idx'>) {
    const lastProtocolAccount = getLastProtocolAccount(protocol);
    const idx: number = (lastProtocolAccount) ? lastProtocolAccount.idx + 1 : 0;
    accountsRaw.value.push({
      protocol,
      isRestored,
      idx,
      type: ACCOUNT_HD_WALLET,
    });
  }

  /**
   * Establish how many accounts are present under the actual seed phrase in each of the protocols
   * and collect the raw versions so they can be stored in the browser storage.
   */
  async function discoverAccounts() {
    const accountsToRecover: number[] = await Promise.all(
      PROTOCOLS.map(
        (protocol) => ProtocolAdapterFactory
          .getAdapter(protocol)
          .discoverAccounts(mnemonicSeed.value),
      ),
    );

    PROTOCOLS.forEach((protocol, index) => {
      for (let i = 0; i < accountsToRecover[index]; i += 1) {
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
    if (!isIdxInitialized) {
      await watchUntilTruthy(() => store.state.isRestored);

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
    activeAccount,
    activeAccountGlobalIdx,
    activeAccountFaucetUrl,
    activeAccountName,
    activeAccountSimplexLink,
    isLoggedIn,
    mnemonic,
    mnemonicSeed,
    protocolsInUse,
    discoverAccounts,
    prepareAccountSelectOptions,
    isLocalAccountAddress,
    addRawAccount,
    getAccountByAddress,
    getAccountByGlobalIdx,
    getLastActiveProtocolAccount,
    setActiveAccountByAddress,
    setActiveAccountByGlobalIdx,
    setMnemonic,
    setGeneratedMnemonic,
    resetAccounts,
  };
}
