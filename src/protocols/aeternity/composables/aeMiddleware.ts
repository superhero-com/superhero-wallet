import { ref } from 'vue';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import { flatMap, groupBy } from 'lodash-es';
import { AensName, Encoded, Tag } from '@aeternity/aepp-sdk';
import type {
  AccountAddress,
  IMiddlewareStatus,
  IPageableResponse,
  ITransaction,
} from '@/types';
import { PROTOCOLS } from '@/constants';
import {
  fetchJson,
  getActivityHash,
  isNotFoundError,
  watchUntilTruthy,
} from '@/utils';
import JsonBig from '@/lib/json-big';

import { ACTIVITIES_TYPES, TX_FUNCTIONS } from '@/protocols/aeternity/config';
import { createPollingBasedOnMountedComponents } from '@/composables/composablesHelpers';
import { useTippingContracts } from '@/composables/tippingContracts';

import { useAeNetworkSettings } from './aeNetworkSettings';
import { categorizeContractCallTxObject } from '../helpers';

const POLLING_INTERVAL = 10000;

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

const isMiddlewareUnavailable = ref(false);
const middlewareStatus = ref<IMiddlewareStatus>();

/**
 * Requests to the middleware v3 API of the active network.
 * @link https://github.com/aeternity/ae_mdw#readme
 */
export function useAeMiddleware() {
  const { aeActiveNetworkSettings } = useAeNetworkSettings();

  async function fetchFromMiddleware<T = any>(path: string): Promise<T | null> {
    await watchUntilTruthy(aeActiveNetworkSettings);
    return fetchJson(`${aeActiveNetworkSettings.value.middlewareUrl}${path}`);
  }

  async function fetchFromMiddlewareCamelCased(path: string) {
    return fetchFromMiddleware(path).then(camelCaseKeysDeep);
  }

  /**
   * Keeps integers too big for a JS number (e.g. aettos) as exact strings.
   */
  async function fetchFromMiddlewareCamelCasedPrecise(path: string) {
    await watchUntilTruthy(aeActiveNetworkSettings);
    const response = await fetch(`${aeActiveNetworkSettings.value.middlewareUrl}${path}`);
    if (!response.ok) {
      throw Object.assign(
        new Error(`Middleware responded with ${response.status} to ${path}`),
        { statusCode: response.status },
      );
    }
    return camelCaseKeysDeep(JsonBig.parse(await response.text()));
  }

  async function fetchMiddlewareStatus(): Promise<IMiddlewareStatus> {
    return fetchFromMiddlewareCamelCased('/v3/status');
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

  async function fetchTransaction(hash: string): Promise<ITransaction> {
    return fetchFromMiddlewareCamelCasedPrecise(`/v3/transactions/${encodeURIComponent(hash)}`);
  }

  async function fetchTransactions(
    query: Record<string, string | number>,
  ): Promise<IPageableResponse<ITransaction>> {
    const searchParams = new URLSearchParams(
      Object.entries(query).map(([key, value]) => [key, value.toString()]),
    );
    return fetchFromMiddlewareCamelCasedPrecise(`/v3/transactions?${searchParams}`);
  }

  /**
   * A name in its first auction is found only among the auctions.
   */
  async function fetchNameByHash(hash: Encoded.Name): Promise<AensName> {
    const encodedHash = encodeURIComponent(hash);
    try {
      return (await fetchFromMiddlewareCamelCased(`/v3/names/${encodedHash}`)).name;
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
      return (await fetchFromMiddlewareCamelCased(`/v3/names/auctions/${encodedHash}`)).name;
    }
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
    fetchFromMiddleware,
    fetchFromMiddlewareCamelCased,
    fetchFromMiddlewareCamelCasedPrecise,
    fetchMiddlewareStatus,
    fetchTransaction,
    fetchTransactions,
    fetchNameByHash,
    normalizeActivitiesStructure,
    normalizeMiddlewareTransactionStructure,
    isMiddlewareUnavailable,
    middlewareStatus,
  };
}
