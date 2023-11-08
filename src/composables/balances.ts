import { computed } from 'vue';
import { mapValues } from 'lodash-es';
import BigNumber from 'bignumber.js';
import type {
  Balance,
  BalanceRaw,
} from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { handleUnknownError, isNotFoundError } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useCurrencies } from '@/composables/currencies';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useAccounts } from './accounts';
import { createNetworkWatcher } from './networks';
import { useStorageRef } from './storageRef';

type Balances = Record<string, Balance>;

// TODO: Set it to 3000 once the own middleware is ready
const POLLING_INTERVAL = 5000;

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);
const { onNetworkChange } = createNetworkWatcher();

const balances = useStorageRef<Balances>({}, STORAGE_KEYS.balances, {
  serializer: {
    read: (val) => mapValues(val, (balance: BalanceRaw) => new BigNumber(balance)),
    write: (val) => mapValues(val, (balance) => balance.toFixed()),
  },
});

/**
 * This composable detects if any app components requires balances data and polls the API
 * to live update the values. If no components are using it the polling stops.
 */
export function useBalances() {
  const { activeAccount, accounts } = useAccounts();
  const { getCurrentCurrencyRate } = useCurrencies();

  const balance = computed(() => balances.value[activeAccount.value.address] || new BigNumber(0));

  const accountsTotalBalance = computed(() => {
    const result = accounts.value.reduce(
      (total, account) => {
        const accountBalance = balances.value?.[account.address];
        if (!accountBalance) {
          return total;
        }
        return total + (getCurrentCurrencyRate(account.protocol) * accountBalance.toNumber());
      },
      0,
    );

    return result.toFixed(2);
  });

  function getAccountBalance(address: string) {
    return balances.value[address] || new BigNumber(0);
  }

  async function updateBalances() {
    const balancesPromises = accounts.value.map(
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
    balances.value = rawBalances.reduce(
      (acc, rawBalance, index) => ({
        ...acc,
        [accounts.value[index].address]: BigNumber(rawBalance || 0),
      }),
      {},
    );
  }

  onNetworkChange(() => {
    updateBalances();
  });

  initPollingWatcher(() => updateBalances());

  return {
    balances,
    accountsTotalBalance,
    balance,
    getAccountBalance,
    updateBalances,
  };
}
