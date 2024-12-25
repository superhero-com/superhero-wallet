import { computed, ref } from 'vue';
import { uniq } from 'lodash-es';

import type {
  AccountAddress,
  AccountType,
  IAccount,
  IAccountRaw,
  IFormSelectOption,
  Protocol,
  ProtocolRecord,
} from '@/types';
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPES_LIST,
  MODAL_PROTOCOL_SELECT,
  PROTOCOL_LIST,
  PROTOCOLS,
  STORAGE_KEYS,
} from '@/constants';
import {
  createCallbackRegistry,
  createCustomScopedComposable,
  decryptedComputed,
  excludeFalsy,
  prepareAccountSelectOptions,
  watchUntilTruthy,
} from '@/utils';
import { tg } from '@/popup/plugins/i18n';
import migrateAccountsVuexToComposable from '@/migrations/001-accounts-vuex-to-composable';

import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useStorageRef, useAuth, useModals } from '@/composables';

import AirGapIcon from '@/icons/air-gap.svg?vue-component';
import LedgerIcon from '@/icons/ledger.svg?vue-component';
import PrivateKeyIcon from '@/icons/private-key.svg?vue-component';

const {
  addCallback: onAccountChange,
  runCallbacks: runOnAccountChangeCallbacks,
} = createCallbackRegistry<(newAccount: IAccount, oldAccount: IAccount) => any>();

/**
 * Composable that handles all operations related to the accounts.
 * The app is storing only basic account data in the browser storage.
 * The wallets's data is created in fly with the use of computed properties.
 */
export const useAccounts = createCustomScopedComposable(() => {
  const {
    mnemonic,
    mnemonicSeed,
    isMnemonicRestored,
    encryptionKey,
  } = useAuth();

  const { openModal } = useModals();

  const areAccountsRestored = ref(false);
  const arePrivateKeysAccountsDecrypted = ref(false);
  const arePrivateKeysAccountsEncryptedRestored = ref(false);

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

  const accountsPrivateKeysEncrypted = useStorageRef<string | null>(
    null,
    STORAGE_KEYS.privateKeyAccountsRaw,
    {
      backgroundSync: true,
      enableSecureStorage: true,
      onRestored: () => {
        arePrivateKeysAccountsEncryptedRestored.value = true;
      },
    },
  );

  /**
   * `accountsPrivateKeysDecrypted` stores the JSON version
   * of the array of imported account private keys
   */
  const accountsPrivateKeysDecrypted = decryptedComputed(
    encryptionKey,
    accountsPrivateKeysEncrypted,
    '[]',
    {
      onDecrypted: () => {
        arePrivateKeysAccountsDecrypted.value = true;
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

  const arePrivateKeysAccountsRestored = computed(() => (
    (arePrivateKeysAccountsEncryptedRestored.value && !accountsPrivateKeysEncrypted.value)
    || (arePrivateKeysAccountsEncryptedRestored.value && arePrivateKeysAccountsDecrypted.value)
  ));

  const privateKeyAccountsRaw = computed<IAccountRaw[]>(() => JSON.parse(accountsPrivateKeysDecrypted.value || '[]'));

  const areAccountsReady = computed(() => (
    areAccountsRestored.value && arePrivateKeysAccountsRestored.value
  ));

  const accounts = computed((): IAccount[] => {
    const ms = mnemonicSeed.value;
    if (!isMnemonicRestored.value || !ms || !accountsRaw.value?.length) {
      return [];
    }

    // Indexes for each protocol and account type
    const idxList = PROTOCOL_LIST.reduce(
      (acc, protocol) => ({
        ...acc,
        [protocol]: ACCOUNT_TYPES_LIST.reduce(
          (acc2, type) => ({ ...acc2, [type]: 0 }),
          {} as Record<AccountType, number>,
        ),
      }),
      {} as Required<ProtocolRecord<Record<AccountType, number>>>,
    );

    return [...accountsRaw.value, ...privateKeyAccountsRaw.value]
      .map((account, globalIdx) => {
        const idx = idxList[account.protocol][account.type];

        const adapter = ProtocolAdapterFactory.getAdapter(account.protocol);
        const resolvedAccount = adapter
          .resolveAccountRaw(account, idx, globalIdx, ms);
        if (resolvedAccount) {
          idxList[account.protocol][account.type] += 1;
        } else {
          accountsRaw.value.splice(globalIdx, 1);
        }
        return resolvedAccount;
      }).filter(excludeFalsy) as IAccount[];
  });

  const activeAccount = computed(
    (): IAccount => accounts.value[activeAccountGlobalIdx.value] || {},
  );

  const isActiveAccountAirGap = computed(
    (): boolean => activeAccount.value.type === ACCOUNT_TYPES.airGap,
  );

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
    (): IAccount[] => accountsGroupedByProtocol.value[PROTOCOLS.aeternity] || [],
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

  function getAccountByAddress(address: AccountAddress): IAccount | undefined {
    return accounts.value.find((acc) => acc.address === address);
  }

  function getAccountByGlobalIdx(globalIdx: number): IAccount | undefined {
    return accounts.value.find((acc) => acc.globalIdx === globalIdx);
  }

  function getAccountsSelectOptionsByProtocol(protocol: Protocol): IFormSelectOption[] {
    return prepareAccountSelectOptions(accounts.value.filter((acc) => acc.protocol === protocol));
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
    const accountCurrent = activeAccount.value;
    const accountNew = getAccountByGlobalIdx(globalIdx);
    activeAccountGlobalIdx.value = accountNew?.globalIdx || 0;

    if (accountNew && accountCurrent.address !== accountNew.address) {
      protocolLastActiveGlobalIdx.value[accountNew.protocol] = accountNew.globalIdx;
      runOnAccountChangeCallbacks(accountNew, accountCurrent);
    }
  }

  function setActiveAccountByAddress(address?: AccountAddress) {
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

  /**
   * Determine if provided address belongs to any of the current user's accounts.
   */
  function isLocalAccountAddress(address: AccountAddress): boolean {
    return accountsAddressList.value.includes(address);
  }

  function addRawAccount(account: IAccountRaw): number {
    accountsRaw.value.push(account);
    return getLastProtocolAccount(account.protocol)?.globalIdx || 0;
  }

  async function addPrivateKeyAccount(account: IAccountRaw): Promise<number> {
    const length = privateKeyAccountsRaw.value.length || 0;
    accountsPrivateKeysDecrypted.value = JSON.stringify([
      ...privateKeyAccountsRaw.value,
      account,
    ]);

    await watchUntilTruthy(() => privateKeyAccountsRaw.value.length === length + 1);
    return getLastProtocolAccount(account.protocol)?.globalIdx || 0;
  }

  /**
   * Establish the last used account index under the actual seed phrase for each of the protocols
   * and collect the raw accounts so they can be stored in the browser storage.
   */
  async function discoverAccounts() {
    const ms = mnemonicSeed.value;
    if (ms == null) throw new Error('Can\'t discover accounts without mnemonic seed');
    const lastUsedAccountIndexRegistry: number[] = await Promise.all(
      PROTOCOL_LIST.map(
        (protocol) => ProtocolAdapterFactory
          .getAdapter(protocol)
          .discoverLastUsedAccountIndex(ms),
      ),
    );

    PROTOCOL_LIST.forEach((protocol, index) => {
      for (let i = 0; i <= lastUsedAccountIndexRegistry[index]; i += 1) {
        addRawAccount({ isRestored: true, protocol, type: ACCOUNT_TYPES.hdWallet });
      }
    });

    // If no accounts was discovered user is asked to choose default protocol account.
    if (!accountsAddressList.value.length) {
      try {
        const protocol = await openModal<Protocol>(MODAL_PROTOCOL_SELECT, {
          title: tg('modals.createAccount.title'),
          subtitle: tg('modals.createAccount.generateOrImport'),
        });
        addRawAccount({ isRestored: true, protocol, type: ACCOUNT_TYPES.hdWallet });
      } catch (error) { /* NOOP */ }
    }
  }

  function getAccountIcon(type: AccountType) {
    switch (type) {
      case ACCOUNT_TYPES.airGap:
        return AirGapIcon;
      case ACCOUNT_TYPES.privateKey:
        return PrivateKeyIcon;
      case ACCOUNT_TYPES.ledger:
        return LedgerIcon;
      default:
        return null;
    }
  }

  function resetAccounts() {
    mnemonic.value = '';
    accountsRaw.value = [];
    activeAccountGlobalIdx.value = 0;
  }

  (async () => {
    await watchUntilTruthy(isLoggedIn);

    protocolLastActiveGlobalIdx
      .value[activeAccount.value.protocol] = activeAccount.value.globalIdx;
  })();

  return {
    accounts,
    aeAccounts,
    accountsAddressList,
    accountsSelectOptions,
    accountsGroupedByProtocol,
    aeAccountsSelectOptions,
    accountsRaw,
    activeAccount,
    activeAccountGlobalIdx,
    areAccountsReady,
    areAccountsRestored,
    arePrivateKeysAccountsRestored,
    isLoggedIn,
    isActiveAccountAirGap,
    protocolsInUse,
    discoverAccounts,
    isLocalAccountAddress,
    addRawAccount,
    addPrivateKeyAccount,
    getAccountByAddress,
    getAccountByGlobalIdx,
    getLastActiveProtocolAccount,
    getAccountsSelectOptionsByProtocol,
    getAccountIcon,
    onAccountChange,
    setActiveAccountByAddress,
    setActiveAccountByGlobalIdx,
    setActiveAccountByProtocolAndIdx,
    setActiveAccountByProtocol,
    resetAccounts,
  };
});
