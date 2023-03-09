import { computed, ref } from '@vue/composition-api';
import BigNumber from 'bignumber.js';
import type {
  Balance,
  BalanceRaw,
  IAccount,
  IAsset,
  IDefaultComposableOptions,
} from '../types';
import {
  AETERNITY_SYMBOL,
  AETERNITY_CONTRACT_ID,
  LOCAL_STORAGE_PREFIX,
  aettosToAe,
  isNotFoundError,
  handleUnknownError,
} from '../popup/utils';
import { useSdk } from './sdk';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useCurrencies } from './currencies';

type Balances = Record<string, Balance>;
type BalancesRaw = Record<string, BalanceRaw>;

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
export function useBalances({ store }: IDefaultComposableOptions) {
  const { getSdk } = useSdk({ store });
  const { currentCurrencyRate, aeternityData } = useCurrencies();

  const account = computed<IAccount>(() => store.getters.account);
  const accounts = computed<IAccount[]>(() => store.getters.accounts);

  const balance = computed(() => balances.value[account.value.address] || new BigNumber(0));
  const balanceCurrency = computed(() => balance.value.toNumber() * currentCurrencyRate.value);

  const aeternityToken = computed((): IAsset => ({
    ...aeternityData.value,
    convertedBalance: balance.value,
    symbol: AETERNITY_SYMBOL,
    balanceCurrency: balanceCurrency.value,
    contractId: AETERNITY_CONTRACT_ID,
  }) as IAsset);

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
    aeternityToken,
    balances,
    balance,
    balanceCurrency,
    updateBalances,
  };
}
