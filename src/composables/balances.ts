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

// TODO: Set it to 3000 once the own middleware is ready
const POLLING_INTERVAL = 5000;

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
  const { onNetworkChange } = useNetworks();
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

  async function updateBalances() {
    const accountsCached = accounts.value; // Store the accounts for the time of update process
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
    const newBalances: Balances = {} as Balances;

    rawBalances.forEach((val, index) => {
      const { protocol, address } = accountsCached[index];
      newBalances[protocol] ??= {};
      newBalances[protocol][address] = new BigNumber(val || 0);
    });

    balances.value = newBalances;
  }

  initPollingWatcher(() => updateBalances());

  if (!composableInitialized) {
    composableInitialized = true;

    onNetworkChange(() => {
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
