import {
  computed,
  ComputedRef,
  ref,
  watch,
} from 'vue';
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
  fetchAllPages,
  fetchJson,
  handleUnknownError,
} from '@/utils';
import { Encoded, Name } from '@aeternity/aepp-sdk';
import {
  AUTO_EXTEND_NAME_BLOCKS_INTERVAL,
  PROTOCOLS,
  STORAGE_KEYS,
} from '@/constants';
import Logger from '@/lib/logger';
import {
  useAccounts,
  useAeSdk,
  useModals,
  useNetworks,
  useStorageRef,
} from '@/composables';
import { createPollingBasedOnMountedComponents } from '@/composables/composablesHelpers';
import { tg } from '@/popup/plugins/i18n';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import { UPDATE_POINTER_ACTION } from '@/protocols/aeternity/config';
import { isInsufficientBalanceError } from '@/protocols/aeternity/helpers';
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

type NamesRegistry = Record<NetworkId, Record<AccountAddress, ChainName>>;

let composableInitialized = false;

const ownedNames = useStorageRef<IName[]>([], STORAGE_KEYS.namesOwned);
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

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

/**
 * Aeternity Blockchain allows to match a .chain name to the addresses (AENS service).
 * This composable allows for obtaining and storing the chain names for the current user addresses
 * and external addresses (for example when displaying transaction details).
 */
export function useAeNames() {
  const { aeAccounts, isLocalAccountAddress, getLastActiveProtocolAccount } = useAccounts();
  const { onNetworkChange } = useNetworks();
  const { aeActiveNetworkSettings } = useAeNetworkSettings();
  const { openDefaultModal } = useModals();
  const { nodeNetworkId, getAeSdk } = useAeSdk();
  const { fetchCachedChainNames } = useAeTippingBackend();

  const {
    isMiddlewareReady,
    getMiddleware,
    fetchFromMiddlewareCamelCased,
  } = useAeMiddleware();

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

    const middleware = await getMiddleware();
    return (await middleware.getName(address)).name;
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
    pendingAutoExtendNames.value.push(name);
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
  ) {
    const aeSdk = await getAeSdk();
    const nameObj = new Name(name, aeSdk.getContext());
    try {
      if (type === UPDATE_POINTER_ACTION.extend) {
        await nameObj.extendTtl();
      } else if (type === UPDATE_POINTER_ACTION.update) {
        await nameObj.update({ account_pubkey: address }, { extendPointers: true });
      }
      openDefaultModal({
        msg: tg('pages.names.pointer-added', { type }),
      });
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
    }
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

  initPollingWatcher(() => {
    updateDefaultNames();
  });

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
    areNamesFetching,
    updateOwnedNames,
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
