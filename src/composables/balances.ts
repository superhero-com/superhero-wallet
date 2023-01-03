import { computed, ref } from '@vue/composition-api';
import type { Store } from 'vuex';
import BigNumber from 'bignumber.js';
import { IAccount } from '../types';
import {
  LOCAL_STORAGE_PREFIX,
  aettosToAe,
  isNotFoundError,
  handleUnknownError,
} from '../popup/utils';
import { useSdk } from './sdk';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';

type Balances = Record<string, BigNumber>;
type BalancesRaw = Record<string, string>;

interface UseBalancesOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
}

const POLLING_INTERVAL = 3000;
const LOCAL_STORAGE_BALANCES_KEY = `${LOCAL_STORAGE_PREFIX}_balances`;

function storeBalances(balances: Balances) {
  window.localStorage.setItem(
    LOCAL_STORAGE_BALANCES_KEY,
    JSON.stringify(Object.keys(balances).reduce(
      (acc, address) => ({ ...acc, [address]: balances[address].toNumber() }),
      {},
    )),
  );
}

function getStoredBalances(): Balances {
  const storedBalances = window.localStorage.getItem(LOCAL_STORAGE_BALANCES_KEY);
  const balances: BalancesRaw = storedBalances ? JSON.parse(storedBalances) : {};
  return Object.keys(balances).reduce(
    (acc, address) => ({ ...acc, [address]: new BigNumber(balances[address]) }),
    {},
  );
}

const balances = ref<Balances>(getStoredBalances());
const initPollingWatcher = createPollingBasedOnMountedComponents();

/**
 * This composable detects if any app components requires balances data and polls the API
 * to live update the values. If no components are using it the polling stops.
 */
export function useBalances({ store }: UseBalancesOptions) {
  const { getSdk } = useSdk({ store });

  const account = computed<IAccount>(() => store.getters.account);
  const accounts = computed<IAccount[]>(() => store.getters.accounts);
  const currentCurrencyRate = computed(() => store.getters.currentCurrencyRate);

  const balance = computed(() => balances.value[account.value.address] || new BigNumber(0));
  const balanceCurrency = computed(() => balance.value.toNumber() * currentCurrencyRate.value);

  async function updateBalances() {
    const sdk = await getSdk();
    const balancesPromises = accounts.value.map(
      ({ address }) => sdk.balance(address).catch((error) => {
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

    storeBalances(balances.value as Balances);
  }

  initPollingWatcher(() => updateBalances(), POLLING_INTERVAL);

  return {
    balances,
    balance,
    balanceCurrency,
    updateBalances,
  };
}
