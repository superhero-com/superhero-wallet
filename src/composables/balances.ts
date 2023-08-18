import { computed } from 'vue';
import { isEmpty, mapValues } from 'lodash-es';
import BigNumber from 'bignumber.js';
import type {
  Balance,
  BalanceRaw,
  IDefaultComposableOptions,
} from '@/types';
import { handleUnknownError, isNotFoundError } from '@/utils';
import { aettosToAe } from '@/protocols/aeternity/helpers';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import {
  createNetworkWatcher,
  createPollingBasedOnMountedComponents,
  createStorageRef,
} from './composablesHelpers';
import { useAccounts } from './accounts';

type Balances = Record<string, Balance>;

const POLLING_INTERVAL = 3000;
const LOCAL_STORAGE_BALANCES_KEY = 'balances';

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);
const { onNetworkChange } = createNetworkWatcher();
const { useStorageRef } = createStorageRef<Balances>({}, LOCAL_STORAGE_BALANCES_KEY, {
  scopedToNetwork: true,
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

  const balances = useStorageRef(store);

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
      }) => ProtocolAdapterFactory.getAdapter(protocol).getBalance(address).catch((error) => {
        if (!isNotFoundError(error)) {
          handleUnknownError(error);
        }
        return 0;
      }),
    );
    const balancesAettos = await Promise.all(balancesPromises);

    balances.value = balancesAettos.reduce(
      (acc, val, index) => ({
        ...acc,
        [accounts.value[index].address]: new BigNumber(aettosToAe(val)),
      }),
      {},
    );
  }

  onNetworkChange(store, () => {
    if (isEmpty(balances.value)) {
      updateBalances();
    }
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
