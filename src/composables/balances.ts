import { computed } from 'vue';
import { mapValues } from 'lodash-es';
import BigNumber from 'bignumber.js';
import type {
  AccountAddress,
  Balance,
  BalanceRaw,
  Protocol,
} from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { handleUnknownError, isNotFoundError } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useCurrencies } from '@/composables/currencies';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useAccounts } from './accounts';
import { useStorageRef } from './storageRef';
import { useNetworks } from './networks';

type Balances = Record<Protocol, Record<AccountAddress, Balance>>;
type BalancesSerialized = Record<Protocol, Record<AccountAddress, string>>;

let composableInitialized = false;
let balancesUpdatePromise: Promise<void> | null = null;

// TODO: Set it to 3000 once the own middleware is ready
const POLLING_INTERVAL = 8000;

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

const balances = useStorageRef<Balances, BalancesSerialized>(
  {} as Balances,
  STORAGE_KEYS.balances,
  {
    serializer: {
      read: (val) => mapValues(val, (perProtocol) => (
        mapValues(perProtocol, (balance: BalanceRaw) => new BigNumber(balance))
      )),
      write: (val) => mapValues(val, (perProtocol) => (
        mapValues(perProtocol, (balance) => balance.toFixed())
      )),
    },
  },
);

/**
 * This composable detects if any app components requires balances data and polls the API
 * to live update the values. If no components are using it the polling stops.
 */
export function useBalances() {
  const { activeAccount, accounts } = useAccounts();
  const { activeNetwork, onNetworkChange } = useNetworks();
  const { getCurrentCurrencyRate } = useCurrencies();

  const balance = computed(() => (
    balances.value[activeAccount.value.protocol]?.[activeAccount.value.address]
    || new BigNumber(0)));

  const accountsTotalBalance = computed(
    () => accounts.value.reduce(
      (total, account) => {
        const accountBalance = balances.value?.[account.protocol]?.[account.address];
        if (!accountBalance) {
          return total;
        }
        return total + (getCurrentCurrencyRate(account.protocol) * accountBalance.toNumber());
      },
      0,
    ).toFixed(2),
  );

  function getAccountBalance(protocol: Protocol, address: string) {
    return balances.value[protocol]?.[address] || new BigNumber(0);
  }

  async function processBalancesUpdate() {
    const accountsCached = accounts.value; // Store the accounts for the time of update process
    // Capture the network at the start so we can discard the result if the
    // user switches networks mid-fetch. Individual `fetchBalance` calls go
    // through SDKs that read the active network dynamically, so a fetch
    // that started on the previous network may resolve with values that
    // partially or fully belong to the new one.
    const networkAtStart = activeNetwork.value.name;
    const balancesPromises = accountsCached.map(
      async ({
        address,
        protocol,
      }) => ProtocolAdapterFactory.getAdapter(protocol).fetchBalance(address).catch((error) => {
        if (!isNotFoundError(error)) {
          handleUnknownError(error);
        }
        return 0;
      }),
    );
    const rawBalances = await Promise.all(balancesPromises);

    if (activeNetwork.value.name !== networkAtStart) {
      return;
    }

    const newBalances: Balances = {} as Balances;

    rawBalances.forEach((val, index) => {
      const { protocol, address } = accountsCached[index];
      newBalances[protocol] ??= {};
      newBalances[protocol][address] = new BigNumber(val || 0);
    });

    balances.value = newBalances;
  }

  async function updateBalances() {
    if (!balancesUpdatePromise) {
      const updatePromise = processBalancesUpdate()
        .finally(() => {
          if (balancesUpdatePromise === updatePromise) {
            balancesUpdatePromise = null;
          }
        });
      balancesUpdatePromise = updatePromise;
    }
    return balancesUpdatePromise;
  }

  initPollingWatcher(() => updateBalances());

  if (!composableInitialized) {
    composableInitialized = true;

    onNetworkChange(() => {
      // Clear stale balances so the UI doesn't display the previous
      // network's values until the next poll completes.
      balances.value = {} as Balances;
      // Drop the in-flight dedup reference so the next `updateBalances()`
      // call starts a fresh fetch for the new network instead of awaiting
      // the previous network's promise (which is now self-cancelling via
      // the `networkAtStart` guard inside `processBalancesUpdate`).
      balancesUpdatePromise = null;
      updateBalances();
    });
  }

  return {
    balances,
    accountsTotalBalance,
    balance,
    getAccountBalance,
    updateBalances,
  };
}
