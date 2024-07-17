import {
  computed,
  ComputedRef,
  ref,
  watch,
} from 'vue';
import { AensName, Encoded, NAME_TTL } from '@aeternity/aepp-sdk';
import { isEmpty } from 'lodash-es';

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

interface preclaimedName {
  address: string;
  name: AensName;
  salt: number;
  blockHeight: number;
  autoExtend: boolean;
}

interface aeNamesOptions {
  pollingDisabled?: boolean;
}

type NamesRegistry = Record<NetworkId, Record<AccountAddress, ChainName>>;

let composableInitialized = false;

const ownedNames = useStorageRef<IName[]>([], STORAGE_KEYS.namesOwned);
const preclaimedNames = useStorageRef<Record<NetworkId, Record<AensName, preclaimedName>>>(
  {},
  STORAGE_KEYS.preclaimedNames,
);
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
    options = {},
  ) {
    const aeSdk = await getAeSdk();
    const nameEntry = await aeSdk.aensQuery(name);
    try {
      if (type === UPDATE_POINTER_ACTION.extend) {
        await nameEntry.extendTtl(NAME_TTL);
      } else if (type === UPDATE_POINTER_ACTION.update) {
        await aeSdk.aensUpdate(
          name,
          { account_pubkey: address },
          { ...options, extendPointers: true },
        );
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

  async function addNameToClaimQueue(name: AensName, address: string, autoExtend: boolean) {
    const aeSdk = await getAeSdk();
    const nameSalt = (await aeSdk.aensPreclaim(name)).salt;
    if (!preclaimedNames.value[nodeNetworkId.value!]) {
      preclaimedNames.value[nodeNetworkId.value!] = {};
    }
    preclaimedNames.value[nodeNetworkId.value!][name] = {
      address,
      name,
      salt: nameSalt,
      blockHeight: topBlockHeight.value,
      autoExtend,
    };
  }

  async function claimName({
    name,
    address,
    autoExtend,
    salt,
    blockHeight,
  }: preclaimedName) {
    let claimTxHash;
    const aeSdk = await getAeSdk();

    /**
     * The claim transaction is intended to be executed in the next block after preclaim.
     * To claim the name instantly and not block other transactions on this account,
     * the claim transaction will be included in the next block.
     */
    if (topBlockHeight.value < blockHeight + 1) {
      return;
    }

    const signingAccount = new AeAccountHdWallet(nodeNetworkId);
    const claimOptions = (activeAccount.value.address !== address)
      ? {
        onAccount: {
          address,
          signTransaction: signingAccount.signTransaction.bind({
            nodeNetworkId,
            sign: signingAccount.sign,
          }),
        },
        fromAccount: address,
      } as any
      : {};

    try {
      claimTxHash = (await aeSdk.aensClaim(name, salt, claimOptions)).hash;
      if (autoExtend) {
        setPendingAutoExtendName(name);
      }
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('is not enough to execute') || error.statusCode === 404) {
        msg = tg('pages.names.balance-error');
      }
      openDefaultModal({ icon: 'critical', msg });
      return;
    } finally {
      delete preclaimedNames.value[nodeNetworkId.value!][name];
    }

    try {
      await aeSdk.poll(claimTxHash);
      if (AE_AENS_NAME_AUCTION_MAX_LENGTH < name.length) {
        await updateNamePointer({ name, address }, claimOptions);
      }
    } catch (error: any) {
      openDefaultModal({ msg: error.message });
    } finally {
      updateOwnedNames();
    }
  }

  async function claimPreclaimedNames() {
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
    claimName,
    updateOwnedNames,
    getName,
    getNameAuction,
    getNameAuctionHighestBid,
    updateNamePointer,
    setAutoExtend,
    setAuctionEntry,
    setPendingAutoExtendName,
    setDefaultName,
  };
}
