import { computed, ref } from 'vue';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import { camelCase } from 'lodash-es';
import { Tag } from '@aeternity/aepp-sdk';
import type {
  AccountAddress,
  IMiddleware,
  IMiddlewareStatus,
  ITransaction,
} from '@/types';
import { PROTOCOLS } from '@/constants';
import { fetchJson, watchUntilTruthy } from '@/utils';
import { genSwaggerClient, mapObject } from '@/lib/swagger';

import type { IAeNetworkSettings } from '@/protocols/aeternity/types';
import { AEX9_TRANSFER_EVENT, TX_FUNCTIONS } from '@/protocols/aeternity/config';
import { createPollingBasedOnMountedComponents } from '@/composables/composablesHelpers';

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

  function normalizeMiddlewareTransactionStructure(
    { payload, type }: any, // Response data
    transactionOwner?: AccountAddress,
  ): ITransaction {
    const normalizedTransaction: ITransaction = {
      ...payload,
      tx: payload.tx || {}, // Ensure `tx` property is defined
      transactionOwner,
      protocol: PROTOCOLS.aeternity,
    };

    // AEX9 transfer has no TX property so we need to normalize it
    if (type === AEX9_TRANSFER_EVENT) {
      normalizedTransaction.hash = payload.txHash;
      normalizedTransaction.tx = {
        ...payload,
        function: TX_FUNCTIONS.transfer,
        callerId: payload.senderId,
        type: Tag[Tag.ContractCallTx],
      };
      normalizedTransaction.incomplete = true;
    }

    const contractCallData = categorizeContractCallTxObject(normalizedTransaction);
    if (contractCallData) {
      normalizedTransaction.tx.amount = contractCallData.amount;
      normalizedTransaction.tx.contractId = contractCallData.assetContractId;
      normalizedTransaction.url = contractCallData.url;
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
    normalizeMiddlewareTransactionStructure,
    isMiddlewareReady,
    isMiddlewareUnavailable,
    middlewareStatus,
  };
}
