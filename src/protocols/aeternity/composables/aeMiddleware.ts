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
/**
 * A hung init would otherwise block every middleware consumer for as long as the
 * socket stays open - `fetchJson` has no timeout of its own.
 */
const INIT_TIMEOUT = 30000;

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

const middleware = ref<IMiddleware | null>(null);
let initMiddlewarePromise: Promise<void> | null = null;
const isMiddlewareReady = computed(() => !!middleware.value);
const isMiddlewareUnavailable = ref(false);
const middlewareStatus = ref<IMiddlewareStatus>();

/**
 * Store the last used network settings to detect network change
 * whenever the middleware is accessed.
 */
let middlewareCurrentAeNetworkSettings: IAeNetworkSettings;

/**
 * Reject once `INIT_TIMEOUT` elapses so a stalled request cannot hold every
 * middleware consumer indefinitely. Callers already handle a rejected init.
 */
function withInitTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_r, reject) => {
      timeout = setTimeout(() => reject(new Error('Middleware init timed out')), INIT_TIMEOUT);
    }),
  ]).finally(() => clearTimeout(timeout));
}

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
    await watchUntilTruthy(aeActiveNetworkSettings);
    // Snapshot the settings: a switch mid-init must leave the recorded URL pointing at
    // the client actually built, so the check below re-inits instead of keeping it.
    const aeNetworkSettings = aeActiveNetworkSettings.value;
    const { middlewareUrl } = aeNetworkSettings;

    const spec = await withInitTimeout(fetchJson(`${middlewareUrl}/v2/api`));

    middleware.value = mapObject(
      (await withInitTimeout(genSwaggerClient(middlewareUrl, { spec }) as Promise<any>)).api,
      ([key, value]: any[]) => [camelCase(key), value],
    ) as any;
    // Only once the client is live - a failed init must not look like a completed switch.
    middlewareCurrentAeNetworkSettings = aeNetworkSettings;
  }

  /**
   * Get the current middleware instance. Create new one if it's not instantiated
   * or the currently used app network settings has different value for the `middlewareUrl`.
   */
  async function getMiddleware(): Promise<IMiddleware> {
    // While an init is in flight `middleware` still holds the PREVIOUS network's client,
    // so wait for the init itself - waiting for the ref to be truthy returns the old one.
    // Looped, not a single wait: if the one we were waiting on just failed, another
    // waiter may already have started a fresh attempt - join that one too instead of
    // starting a third.
    while (initMiddlewarePromise) {
      // Each iteration waits on whichever promise is current, not a static collection -
      // re-checking after each wait is the point.
      // eslint-disable-next-line no-await-in-loop
      await initMiddlewarePromise.catch(() => {});
    }

    const previousMdwUrl = middlewareCurrentAeNetworkSettings?.middlewareUrl;
    const currentMdwUrl = aeActiveNetworkSettings.value.middlewareUrl;

    if (!middleware.value || previousMdwUrl !== currentMdwUrl) {
      initMiddlewarePromise = initMiddleware();
      try {
        await initMiddlewarePromise;
      } finally {
        initMiddlewarePromise = null;
      }
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
