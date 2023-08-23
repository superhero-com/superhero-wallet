import { computed } from 'vue';
import { mapValues } from 'lodash-es';
import BigNumber from 'bignumber.js';
import type {
  Balance,
  BalanceRaw,
  IDefaultComposableOptions,
} from '@/types';
import { handleUnknownError, isNotFoundError } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import {
  createPollingBasedOnMountedComponents,
  useStorageRef,
} from './composablesHelpers';
import { useAccounts } from './accounts';
import { createNetworkWatcher } from './networks';

type Balances = Record<string, Balance>;

// TODO: Set it to 3000 once the own middleware is ready
const POLLING_INTERVAL = 5000;
const LOCAL_STORAGE_BALANCES_KEY = 'balances';

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);
const { onNetworkChange } = createNetworkWatcher();

const balances = useStorageRef<Balances>({}, LOCAL_STORAGE_BALANCES_KEY, {
  serializer: {
    read: (val) => mapValues(val, (balance: BalanceRaw) => new BigNumber(balance)),
    write: (val) => mapValues(val, (balance) => balance.toFixed()),
  },
});

/**
 * This composable detects if any app components requires balances data and polls the API
 * to live update the values. If no components are using it the polling stops.
 */
export function useBalances({ store }: IDefaultComposableOptions) {
  const { activeAccount, accounts } = useAccounts({ store });

  const balance = computed(() => balances.value[activeAccount.value.address] || new BigNumber(0));
  const balancesTotal = computed(
    () => Object.keys(balances.value)
      .reduce((total, key) => total.plus(balances.value[key]), new BigNumber(0))
      .toFixed(),
  );

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
      (acc, val, index) => ({
        ...acc,
        [accounts.value[index].address]: BigNumber(val),
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
    balancesTotal,
    balance,
    getAccountBalance,
    updateBalances,
  };
}
