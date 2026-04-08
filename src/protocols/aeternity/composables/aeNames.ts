import {
  computed,
  ComputedRef,
  ref,
  watch,
} from 'vue';
import {
  AensName,
  Encoded,
  Name,
} from '@aeternity/aepp-sdk';
import { isEmpty, isEqual } from 'lodash-es';

import type {
  ChainName,
  IName,
  ITransaction,
  NetworkId,
  IAddressNamePair,
  IAuction,
  IAuctionBid,
  AccountAddress,
} from '@/types';

import {
  decryptedComputed,
  fetchAllPages,
  fetchJson,
  handleUnknownError,
} from '@/utils';
import {
  AUTO_EXTEND_NAME_BLOCKS_INTERVAL,
  PROTOCOLS,
  STORAGE_KEYS,
} from '@/constants';
import Logger from '@/lib/logger';
import {
  useAccounts,
  useAeSdk,
  useAuth,
  useModals,
  useNetworks,
  useStorageRef,
  useTopHeaderData,
} from '@/composables';
import { createPollingBasedOnMountedComponents } from '@/composables/composablesHelpers';
import { tg } from '@/popup/plugins/i18n';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { UPDATE_POINTER_ACTION, AE_AENS_NAME_AUCTION_MAX_LENGTH } from '@/protocols/aeternity/config';
import { isInsufficientBalanceError } from '@/protocols/aeternity/helpers';
import { AeAccountHdWallet } from '@/protocols/aeternity/libs/AeAccountHdWallet';

import { useAeNetworkSettings } from './aeNetworkSettings';
import { useAeTippingBackend } from './aeTippingBackend';
import { useAeMiddleware } from './aeMiddleware';

const POLLING_INTERVAL = 10000;

interface IUpdateNamePointerParams {
  name: ChainName;
  address?: any;
  type?: keyof typeof UPDATE_POINTER_ACTION;
}

interface IAuctionEntryParams {
  name: ChainName;
  expiration: number;
  bids: IAuctionBid[];
}

export const NAME_CLAIM_STATUS = {
  preclaimed: 'preclaimed',
  claimSubmitted: 'claim-submitted',
  pointerUpdatePending: 'pointer-update-pending',
} as const;

type NameClaimStatus = typeof NAME_CLAIM_STATUS[keyof typeof NAME_CLAIM_STATUS];

interface IPreclaimedName {
  address: string;
  name: AensName;
  salt: number;
  blockHeight: number;
  autoExtend: boolean;
  status: NameClaimStatus;
  claimTxHash?: Encoded.TxHash;
}

interface aeNamesOptions {
  pollingDisabled?: boolean;
}

type NamesRegistry = Record<NetworkId, Record<AccountAddress, ChainName>>;

let composableInitialized = false;
let claimPreclaimedNamesPromise: Promise<void> | null = null;
let preclaimedNamesEncryptionInitialized = false;

const ownedNames = useStorageRef<IName[]>([], STORAGE_KEYS.namesOwned);
const preclaimedNamesEncrypted = useStorageRef<string | null>(
  null,
  STORAGE_KEYS.preclaimedNames,
  { enableSecureStorage: true },
);
const preclaimedNames = ref<Record<NetworkId, Record<AensName, IPreclaimedName>>>({});
const pendingAutoExtendNames = ref<ChainName[]>([]);
const areNamesFetching = ref(false);

/**
 * Stores default names for a certain local account addresses in selected network
 */
const defaultNamesRegistry = useStorageRef<NamesRegistry>({}, STORAGE_KEYS.namesDefault);
/**
 * Stores default names for a certain external account addresses in selected network
 */
const externalNamesRegistry = ref<NamesRegistry>({});
const auctions = ref<Record<string, IAuction>>({});

const resolvedChainNames = ref<Record<Encoded.Name, AensName>>({});

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

/**
 * Aeternity Blockchain allows to match a .chain name to the addresses (AENS service).
 * This composable allows for obtaining and storing the chain names for the current user addresses
 * and external addresses (for example when displaying transaction details).
 */
export function useAeNames({ pollingDisabled = false }: aeNamesOptions = {}) {
  const {
    aeAccounts,
    activeAccount,
    isLocalAccountAddress,
    getLastActiveProtocolAccount,
  } = useAccounts();
  const { onNetworkChange } = useNetworks();
  const { aeActiveNetworkSettings } = useAeNetworkSettings();
  const { openDefaultModal } = useModals();
  const { nodeNetworkId, getAeSdk } = useAeSdk();
  const { fetchCachedChainNames } = useAeTippingBackend();
  const { topBlockHeight } = useTopHeaderData();

  const {
    isMiddlewareReady,
    getMiddleware,
    fetchFromMiddlewareCamelCased,
  } = useAeMiddleware();

  if (!preclaimedNamesEncryptionInitialized) {
    preclaimedNamesEncryptionInitialized = true;
    const { encryptionKey } = useAuth();
    const decryptedStr = decryptedComputed(encryptionKey, preclaimedNamesEncrypted, '{}');

    watch(decryptedStr, (str) => {
      try {
        const parsed = JSON.parse(str || '{}');
        if (!isEqual(parsed, preclaimedNames.value)) {
          preclaimedNames.value = parsed;
        }
      } catch {
        preclaimedNames.value = {};
      }
    }, { immediate: true });

    watch(preclaimedNames, (val) => {
      const str = JSON.stringify(val);
      if (decryptedStr.value !== str) {
        decryptedStr.value = str;
      }
    }, { deep: true });
  }

  function ensureExternalNameRegistryExists() {
    if (!externalNamesRegistry.value[nodeNetworkId.value!]) {
      externalNamesRegistry.value[nodeNetworkId.value!] = {};
    }
  }

  async function updateExternalName(address: AccountAddress) {
    ensureExternalNameRegistryExists();

    const { preferredChainName } = await fetchJson(`${aeActiveNetworkSettings.value.backendUrl}/profile/${address}`)
      .catch(() => ({}));

    if (preferredChainName) {
      externalNamesRegistry.value[nodeNetworkId.value!][address] = preferredChainName;
    } else {
      delete externalNamesRegistry.value[nodeNetworkId.value!][address];
    }
  }

  // This function returns computed value to have reactive state and show proper data after fetching
  function getName(address?: AccountAddress): ComputedRef<ChainName | string> {
    if (!address || !nodeNetworkId.value) {
      return computed(() => '');
    }

    if (
      isLocalAccountAddress(address)
      || getLastActiveProtocolAccount(PROTOCOLS.aeternity)?.address === address
    ) {
      return computed(() => defaultNamesRegistry.value[nodeNetworkId.value!]?.[address] || '');
    }

    updateExternalName(address);
    return computed(() => externalNamesRegistry.value[nodeNetworkId.value!]?.[address] || '');
  }

  // This function returns the resolved chain name from a name hash
  async function getNameByNameHash(address?: Encoded.Name) {
    if (!address) {
      return '';
    }
    if (!resolvedChainNames.value[address]) {
      const middleware = await getMiddleware();
      resolvedChainNames.value[address] = (await middleware.getName(address)).name;
    }
    return resolvedChainNames.value[address];
  }

  function getNameAuction(name: string): IAuction {
    return auctions.value[name] || null;
  }

  function getNameAuctionHighestBid(name: string): IAuctionBid {
    return getNameAuction(name)
      ?.bids
      .reduce((a, b) => (a.nameFee.isGreaterThan(b.nameFee) ? a : b));
  }

  function setDefaultName({ address, name }: IAddressNamePair) {
    if (!nodeNetworkId.value) {
      return;
    }
    if (!defaultNamesRegistry.value[nodeNetworkId.value]) {
      defaultNamesRegistry.value[nodeNetworkId.value] = {};
    }

    if (name) {
      defaultNamesRegistry.value[nodeNetworkId.value][address] = name;
    } else {
      delete defaultNamesRegistry.value[nodeNetworkId.value][address];
    }
  }

  function setAutoExtend(name: ChainName) {
    const selectedName = ownedNames.value.find((n) => n.name === name);
    if (selectedName) {
      selectedName.autoExtend = !selectedName.autoExtend;
    }
  }

  function setAuctionEntry({ name, expiration, bids }: IAuctionEntryParams) {
    auctions.value[name] = { expiration, bids };
  }

  function setPendingAutoExtendName(name: ChainName) {
    if (!pendingAutoExtendNames.value.includes(name)) {
      pendingAutoExtendNames.value.push(name);
    }
  }

  function ensurePreclaimedNameRegistryExists(networkId: NetworkId) {
    if (!preclaimedNames.value[networkId]) {
      preclaimedNames.value[networkId] = {};
    }
  }

  function upsertPreclaimedName(networkId: NetworkId, name: AensName, data: IPreclaimedName) {
    ensurePreclaimedNameRegistryExists(networkId);
    preclaimedNames.value[networkId][name] = data;
  }

  function patchPreclaimedName(
    networkId: NetworkId,
    name: AensName,
    data: Partial<IPreclaimedName>,
  ): IPreclaimedName | null {
    const existingEntry = preclaimedNames.value[networkId]?.[name];
    if (!existingEntry) {
      return null;
    }
    preclaimedNames.value[networkId][name] = {
      ...existingEntry,
      ...data,
    };
    return preclaimedNames.value[networkId][name];
  }

  function removePreclaimedName(networkId: NetworkId, name: AensName) {
    delete preclaimedNames.value[networkId]?.[name];
    if (isEmpty(preclaimedNames.value[networkId])) {
      delete preclaimedNames.value[networkId];
    }
  }

  function getClaimOptions(address: AccountAddress) {
    if (activeAccount.value.address === address) {
      return {};
    }

    const signingAccount = new AeAccountHdWallet(nodeNetworkId);
    return {
      onAccount: {
        address,
        signTransaction: signingAccount.signTransaction.bind({
          nodeNetworkId,
          sign: signingAccount.sign,
          unsafeSign: signingAccount.unsafeSign,
        }),
      },
      fromAccount: address,
    } as any;
  }

  async function createNameInstance(name: AensName, options = {}) {
    const aeSdk = await getAeSdk();
    return new Name(name, aeSdk.getContext(options));
  }

  function getClaimErrorMessage(error: any) {
    if (error.message.includes('is not enough to execute') || error.statusCode === 404) {
      return tg('pages.names.balance-error');
    }
    return error.message;
  }

  function openClaimErrorModal(error: any) {
    openDefaultModal({
      icon: 'critical',
      msg: getClaimErrorMessage(error),
    });
  }

  function fetchPendingNameClaimTransactions(address: AccountAddress) {
    const aeternityAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.aeternity);
    return aeternityAdapter.fetchPendingTransactions?.(address)
      .then(
        (transactions: ITransaction[]) => (transactions)
          .filter(({ tx: { type } }) => type === 'NameClaimTx')
          .map(({ tx, ...otherTx }) => ({
            ...otherTx,
            ...tx,
            owner: tx.accountId,
          })),
      );
  }

  async function getPendingNameClaimTransaction(address: AccountAddress, name: AensName) {
    const pendingTransactions = await fetchPendingNameClaimTransactions(address) || [];
    return pendingTransactions.find(({ name: pendingName }) => pendingName === name);
  }

  async function fetchAllNames(address: AccountAddress) {
    const middleware = await getMiddleware();

    const names = await fetchAllPages(
      () => middleware.getNames({ owned_by: address as Encoded.AccountAddress, state: 'active', limit: 100 }),
      fetchFromMiddlewareCamelCased,
    );

    return names.map(({ info, name, hash }) => ({
      createdAtHeight: info.activeFrom,
      expiresAt: info.expireHeight,
      owner: info.ownership.current,
      pointers: info.pointers,
      autoExtend: (
        ownedNames.value.find((n) => n.name === name)?.autoExtend
        || pendingAutoExtendNames.value?.includes(name)
      ),
      name,
      hash,
    }));
  }

  async function updateOwnedNames() {
    try {
      areNamesFetching.value = true;

      ownedNames.value = await Promise.all(
        aeAccounts.value.map(({ address }) => Promise.all([
          fetchPendingNameClaimTransactions(address),
          fetchAllNames(address),
        ])),
      ).then((arr) => arr.flat(2)) as IName[];
    } catch (error: any) {
      handleUnknownError(error);
    } finally {
      areNamesFetching.value = false;
    }
  }

  function updateDefaultNames() {
    aeAccounts.value.map(async ({ address }) => {
      const currentNodeId = nodeNetworkId.value;
      const response = await fetchJson(
        `${aeActiveNetworkSettings.value.backendUrl}/profile/${address}`,
      ).catch(() => ({}));

      if (currentNodeId !== nodeNetworkId.value) {
        return;
      }

      setDefaultName({ address, name: response?.preferredChainName });
    });
  }

  async function updateNamePointer(
    {
      name,
      address,
      type = UPDATE_POINTER_ACTION.update,
    }: IUpdateNamePointerParams,
    options = {},
  ): Promise<boolean> {
    const nameObj = await createNameInstance(name, options);
    try {
      if (type === UPDATE_POINTER_ACTION.extend) {
        await nameObj.extendTtl(undefined, options);
      } else if (type === UPDATE_POINTER_ACTION.update) {
        await nameObj.update(
          { account_pubkey: address },
          { ...options, extendPointers: true },
        );
      }
      openDefaultModal({
        msg: tg('pages.names.pointer-added', { type }),
      });
      return true;
    } catch (error: any) {
      if (error.message.includes('Account not found')) {
        handleUnknownError(error);
      } else {
        openDefaultModal({
          msg: isInsufficientBalanceError(error)
            ? tg('modals.insufficient-balance.msg')
            : error.message,
        });
      }
      return false;
    }
  }

  async function addNameToClaimQueue(name: AensName, address: string, autoExtend: boolean) {
    try {
      const networkId = nodeNetworkId.value!;
      const aeSdk = await getAeSdk();
      const nameObj = await createNameInstance(name, getClaimOptions(address));
      const { nameSalt } = await nameObj.preclaim();
      const currentHeight = await aeSdk.getHeight();
      upsertPreclaimedName(networkId, name, {
        address,
        name,
        salt: nameSalt,
        blockHeight: currentHeight,
        autoExtend,
        status: NAME_CLAIM_STATUS.preclaimed,
      });
      return true;
    } catch (error: any) {
      openClaimErrorModal(error);
      return false;
    }
  }

  async function claimName({
    name,
    address,
    autoExtend,
    salt,
    blockHeight,
    status,
    claimTxHash,
  }: IPreclaimedName) {
    const aeSdk = await getAeSdk() as any;
    const networkId = nodeNetworkId.value!;
    let currentClaimTxHash = claimTxHash;

    /**
     * The claim transaction is intended to be executed in the next block after preclaim.
     * To claim the name instantly and not block other transactions on this account,
     * the claim transaction will be included in the next block.
     */
    if (
      status === NAME_CLAIM_STATUS.preclaimed
      && topBlockHeight.value < blockHeight + 1
    ) {
      return;
    }

    const claimOptions = getClaimOptions(address);
    const nameObj = await createNameInstance(name, claimOptions);

    if (status === NAME_CLAIM_STATUS.preclaimed) {
      try {
        const pendingClaimTransaction = await getPendingNameClaimTransaction(address, name);
        currentClaimTxHash = pendingClaimTransaction?.hash
          || (await nameObj.claim({ ...claimOptions, nameSalt: salt, waitMined: false })).hash;
        patchPreclaimedName(networkId, name, {
          status: NAME_CLAIM_STATUS.claimSubmitted,
          claimTxHash: currentClaimTxHash,
        });
      } catch (error: any) {
        removePreclaimedName(networkId, name);
        openClaimErrorModal(error);
        return;
      }
    }

    if (!currentClaimTxHash) {
      return;
    }

    if (status !== NAME_CLAIM_STATUS.pointerUpdatePending) {
      try {
        await aeSdk.poll(currentClaimTxHash);
      } catch (error: any) {
        removePreclaimedName(networkId, name);
        openDefaultModal({ msg: error.message });
        return;
      }
    }

    if (AE_AENS_NAME_AUCTION_MAX_LENGTH < name.length) {
      patchPreclaimedName(networkId, name, {
        status: NAME_CLAIM_STATUS.pointerUpdatePending,
        claimTxHash: currentClaimTxHash,
      });
      const isPointerUpdated = await updateNamePointer({ name, address }, claimOptions);
      if (!isPointerUpdated) {
        return;
      }
    }

    if (autoExtend) {
      setPendingAutoExtendName(name);
    }
    removePreclaimedName(networkId, name);
    await updateOwnedNames();
  }

  async function processPreclaimedNamesQueue() {
    // Ensure the `nodeNetworkId` is established
    await getAeSdk();
    if (isEmpty(preclaimedNames.value[nodeNetworkId.value!])) {
      return;
    }
    const sortedPreclaimedNameArray = Object.values(preclaimedNames.value[nodeNetworkId.value!])
      .sort((a, b) => a.blockHeight - b.blockHeight);
    /* eslint-disable-next-line no-restricted-syntax */
    for (const pendingName of sortedPreclaimedNameArray) {
      // eslint-disable-next-line no-await-in-loop
      await claimName(pendingName);
    }
  }

  async function claimPreclaimedNames() {
    if (!claimPreclaimedNamesPromise) {
      claimPreclaimedNamesPromise = processPreclaimedNamesQueue()
        .finally(() => {
          claimPreclaimedNamesPromise = null;
        });
    }
    return claimPreclaimedNamesPromise;
  }

  async function extendExpiringOwnedNames() {
    const aeSdk = await getAeSdk();
    const height = await aeSdk.getHeight();
    await Promise.all(
      ownedNames.value
        .filter(({ autoExtend }) => autoExtend)
        .filter(({ expiresAt }) => expiresAt - height < AUTO_EXTEND_NAME_BLOCKS_INTERVAL)
        .map(({ name }) => updateNamePointer({
          name,
          type: UPDATE_POINTER_ACTION.extend,
        })),
    );
  }

  /**
   * Fetch all account names involved in recent tipping actions.
   * Mostly useful for displaying proper names in the notifications.
   */
  async function retrieveCachedChainNames() {
    try {
      const [cachedChainNames] = await Promise.all([
        fetchCachedChainNames(),
        getAeSdk(), // Ensure the `nodeNetworkId` is established
      ]);
      if (cachedChainNames) {
        ensureExternalNameRegistryExists();
        externalNamesRegistry.value[nodeNetworkId.value!] = {
          ...externalNamesRegistry.value[nodeNetworkId.value!],
          ...cachedChainNames,
        };
      }
    } catch (error: any) {
      Logger.write(error);
    }
  }

  if (!pollingDisabled) {
    initPollingWatcher(() => updateDefaultNames());
  }

  if (!composableInitialized) {
    composableInitialized = true;

    retrieveCachedChainNames();

    onNetworkChange(async () => {
      await Promise.all([
        updateOwnedNames(),
        updateDefaultNames(),
      ]);
      await extendExpiringOwnedNames();
    });

    watch(
      aeAccounts,
      async (val, oldVal) => {
        if (isMiddlewareReady.value && val !== oldVal) {
          await Promise.all([
            updateOwnedNames(),
            updateDefaultNames(),
          ]);
        }
      },
    );
  }

  return {
    ownedNames,
    preclaimedNames,
    areNamesFetching,
    addNameToClaimQueue,
    claimPreclaimedNames,
    updateOwnedNames,
    resolvedChainNames,
    getName,
    getNameByNameHash,
    getNameAuction,
    getNameAuctionHighestBid,
    updateNamePointer,
    setAutoExtend,
    setAuctionEntry,
    setPendingAutoExtendName,
    setDefaultName,
  };
}
