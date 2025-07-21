import { computed, ref } from 'vue';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import {
  camelCase,
  flatMap,
  groupBy,
} from 'lodash-es';
import { Tag } from '@aeternity/aepp-sdk';
import type {
  AccountAddress,
  IMiddleware,
  IMiddlewareStatus,
  ITransaction,
} from '@/types';
import { PROTOCOLS } from '@/constants';
import { fetchJson, getActivityHash, watchUntilTruthy } from '@/utils';
import { genSwaggerClient, mapObject } from '@/lib/swagger';

import type { IAeNetworkSettings } from '@/protocols/aeternity/types';
import { ACTIVITIES_TYPES, TX_FUNCTIONS } from '@/protocols/aeternity/config';
import { createPollingBasedOnMountedComponents } from '@/composables/composablesHelpers';
import { useTippingContracts } from '@/composables/tippingContracts';

import { useAeNetworkSettings } from './aeNetworkSettings';
import { categorizeContractCallTxObject } from '../helpers';

const POLLING_INTERVAL = 10000;

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

const middleware = ref<IMiddleware | null>(null);
const initializing = ref(false);
const isMiddlewareReady = computed(() => !!middleware.value);
const isMiddlewareUnavailable = ref(false);
const middlewareStatus = ref<IMiddlewareStatus>();

/**
 * Store the last used network settings to detect network change
 * whenever the middleware is accessed.
 */
let middlewareCurrentAeNetworkSettings: IAeNetworkSettings;

export function useAeMiddleware() {
  const { aeActiveNetworkSettings } = useAeNetworkSettings();

  async function fetchFromMiddleware<T = any>(path: string): Promise<T | null> {
    await watchUntilTruthy(aeActiveNetworkSettings);
    return fetchJson(`${aeActiveNetworkSettings.value.middlewareUrl}${path}`);
  }

  async function fetchFromMiddlewareCamelCased(path: string) {
    return fetchFromMiddleware(path).then(camelCaseKeysDeep);
  }

  async function fetchMiddlewareStatus(): Promise<IMiddlewareStatus> {
    return fetchFromMiddlewareCamelCased('/status');
  }

  async function checkMiddlewareStatus() {
    try {
      middlewareStatus.value = await Promise.race(
        [fetchMiddlewareStatus(),
          new Promise((_r, reject) => setTimeout(reject, POLLING_INTERVAL)),
        ],
      ) as IMiddlewareStatus;
      isMiddlewareUnavailable.value = false;
    } catch (e) {
      isMiddlewareUnavailable.value = true;
    }
  }

  /**
   * Force to initialize new middleware instance.
   */
  async function initMiddleware() {
    initializing.value = true;

    await watchUntilTruthy(aeActiveNetworkSettings);
    const { middlewareUrl } = aeActiveNetworkSettings.value;

    const spec = await fetchJson(`${middlewareUrl}/v2/api`);

    middlewareCurrentAeNetworkSettings = aeActiveNetworkSettings.value;

    middleware.value = mapObject(
      (await genSwaggerClient(middlewareUrl, { spec }) as any).api,
      ([key, value]: any[]) => [camelCase(key), value],
    ) as any;

    initializing.value = false;
  }

  /**
   * Get the current middleware instance. Create new one if it's not instantiated
   * or the currently used app network settings has different value for the `middlewareUrl`.
   */
  async function getMiddleware(): Promise<IMiddleware> {
    const previousMdwUrl = middlewareCurrentAeNetworkSettings?.middlewareUrl;
    const currentMdwUrl = aeActiveNetworkSettings.value.middlewareUrl;

    if (initializing.value) {
      await watchUntilTruthy(middleware);
    } else if (!middleware.value || previousMdwUrl !== currentMdwUrl) {
      await initMiddleware();
    }
    return middleware.value!;
  }

  function getMiddlewareRef() {
    return middleware;
  }

  function normalizeActivitiesStructure(activities: any[]) {
    const groupedActivitiesByHash = groupBy(activities, getActivityHash);

    return flatMap(groupedActivitiesByHash, (group) => {
      if (
        group.length === 1
        && (
          group[0].type === ACTIVITIES_TYPES.aex9TransferEvent
          || group[0].type === ACTIVITIES_TYPES.internalContractCallEvent
        )
      ) {
        return group;
      }

      const primaryObjectIndex = group.findIndex(({ type }) => (
        type !== ACTIVITIES_TYPES.aex9TransferEvent
        && type !== ACTIVITIES_TYPES.internalTransferEvent
        && type !== ACTIVITIES_TYPES.internalContractCallEvent
      ));

      if (primaryObjectIndex === -1) {
        // TODO: find the way to handle all the existing activities types
        return [];
      }

      const primaryObject = group[primaryObjectIndex];
      primaryObject.payload.tx.internalEvents = group
        .filter((_, index) => index !== primaryObjectIndex);

      return primaryObject;
    });
  }

  function normalizeMiddlewareTransactionStructure(
    { payload, type, blockTime }: any, // Response data
    transactionOwner?: AccountAddress,
  ): ITransaction {
    const { tippingContractAddresses } = useTippingContracts();
    const normalizedTransaction: ITransaction = {
      ...payload,
      tx: payload.tx || {}, // Ensure `tx` property is defined
      transactionOwner,
      protocol: PROTOCOLS.aeternity,
    };

    // AEX9 transfer has no TX property so we need to normalize it
    if (type === ACTIVITIES_TYPES.aex9TransferEvent) {
      normalizedTransaction.hash = payload.txHash;
      normalizedTransaction.tx = {
        ...payload,
        function: TX_FUNCTIONS.transfer,
        callerId: payload.senderId,
        type: Tag[Tag.ContractCallTx],
      };
      normalizedTransaction.incomplete = true;
    } else if (
      type === ACTIVITIES_TYPES.internalContractCallEvent
      && payload.internalTx.type === Tag[Tag.SpendTx]
    ) {
      normalizedTransaction.hash = payload.callTxHash;
      normalizedTransaction.tx = payload.internalTx;
      // TODO: get an actual time
      normalizedTransaction.microTime = blockTime;
    }

    const contractCallData = categorizeContractCallTxObject(normalizedTransaction);
    if (contractCallData) {
      normalizedTransaction.tx.amount = contractCallData.amount;
      normalizedTransaction.tx.contractId = contractCallData.assetContractId;
      normalizedTransaction.url = contractCallData.url;
    }

    // Tip claim transactions are presented only as a internalContractCallEvent
    // with an internal spendTx to the account

    if (
      tippingContractAddresses.value.tippingV1 === payload.contractId
      && transactionOwner === normalizedTransaction.tx.recipientId
    ) {
      normalizedTransaction.claim = true;
      normalizedTransaction.tx.function = 'claim';
      normalizedTransaction.tx.type = Tag[Tag.ContractCallTx];
      normalizedTransaction.tx.contractId = payload.contractId;
    }

    return normalizedTransaction;
  }

  initPollingWatcher(() => checkMiddlewareStatus());

  return {
    getMiddleware,
    getMiddlewareRef,
    fetchFromMiddleware,
    fetchFromMiddlewareCamelCased,
    fetchMiddlewareStatus,
    normalizeActivitiesStructure,
    normalizeMiddlewareTransactionStructure,
    isMiddlewareReady,
    isMiddlewareUnavailable,
    middlewareStatus,
  };
}
