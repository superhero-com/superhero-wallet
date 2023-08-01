import { computed } from 'vue';
import { Encoded } from '@aeternity/aepp-sdk';
import { isEmpty, mapValues } from 'lodash-es';
import BigNumber from 'bignumber.js';
import type {
  Balance,
  BalanceRaw,
  ICoin,
  IDefaultComposableOptions,
} from '@/types';
import {
  AE_SYMBOL,
  AE_CONTRACT_ID,
} from '@/protocols/aeternity/config';
import {
  isNotFoundError,
  handleUnknownError,
} from '@/popup/utils';
import { aettosToAe } from '@/protocols/aeternity/helpers';
import {
  createNetworkWatcher,
  createPollingBasedOnMountedComponents,
  createStorageRef,
} from './composablesHelpers';
import { useCurrencies } from './currencies';
import { useAccounts } from './accounts';
import { useAeSdk } from './aeSdk';

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
  const { getAeSdk } = useAeSdk({ store });
  const { aeternityData } = useCurrencies();
  const { activeAccount, accounts } = useAccounts({ store });

  const balances = useStorageRef(store);

  const balance = computed(() => balances.value[activeAccount.value.address] || new BigNumber(0));
  const balancesTotal = computed(
    () => Object.keys(balances.value)
      .reduce((total, key) => total.plus(balances.value[key]), new BigNumber(0))
      .toFixed(),
  );

  const aeternityCoin = computed((): ICoin => ({
    ...aeternityData.value!,
    contractId: AE_CONTRACT_ID,
    convertedBalance: +balance.value,
    symbol: AE_SYMBOL,
  }));

  function getAccountBalance(address: string) {
    return balances.value[address] || new BigNumber(0);
  }

  async function updateBalances() {
    const aeSdk = await getAeSdk();
    const balancesPromises = accounts.value.map(
      // TODO - type address in IAccount interface
      ({ address }) => aeSdk.getBalance(address as Encoded.AccountAddress).catch((error) => {
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
    aeternityCoin,
    balances,
    balancesTotal,
    balance,
    getAccountBalance,
    updateBalances,
  };
}
