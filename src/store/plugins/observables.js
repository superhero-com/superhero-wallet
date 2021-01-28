import { BehaviorSubject, timer } from 'rxjs';
import { multicast, pluck, switchMap, map, filter } from 'rxjs/operators';
import { refCountDelay } from 'rxjs-etc/operators';
import { asBigNumber } from '@aeternity/aepp-sdk/es/utils/bignumber';
import {
  isNotFoundError,
  handleUnknownError,
  aettosToAe,
  setBalanceLocalStorage,
  getBalanceLocalStorage,
} from '../../popup/utils/helper';

export default (store) => {
  const watchAsObservable = (getter, options) =>
    // eslint-disable-next-line no-underscore-dangle
    store._watcherVM.$watchAsObservable(() => getter(store.state, store.getters), options);

  const sdk$ = watchAsObservable(({ sdk }) => sdk, { immediate: true }).pipe(
    pluck('newValue'),
    filter((sdk) => sdk),
  );

  const createSdkObservable = (func, def) =>
    sdk$.pipe(
      switchMap((sdk) => timer(0, 30000).pipe(map(() => sdk))),
      switchMap(async (sdk) => (sdk ? func(sdk) : def)),
      multicast(new BehaviorSubject(def)),
      refCountDelay(1000),
    );

  const balance$ = sdk$.pipe(
    switchMap((sdk) => timer(0, 3000).pipe(map(() => sdk))),
    switchMap((sdk) =>
      sdk.balance(store.state.account.publicKey).catch((error) => {
        if (!isNotFoundError(error)) {
          handleUnknownError(error);
        }
        return 0;
      }),
    ),
    map((balanceAettos) => {
      const balance = aettosToAe(balanceAettos);
      if (balance !== getBalanceLocalStorage()) {
        setBalanceLocalStorage(balance);
      }
      return asBigNumber(balance);
    }),
    multicast(new BehaviorSubject(asBigNumber(getBalanceLocalStorage()))),
    refCountDelay(1000),
  );

  const normalizeNotification = ({ entityId, sourceId, entityType, sender, ...other }) => ({
    sourceId,
    entityId,
    entityType,
    ...other,
    sender,
    chainName: store.state.chainNames?.[sender],
    path:
      entityType === 'TIP'
        ? `https://superhero.com/tip/${entityId}`
        : `https://superhero.com/tip/${sourceId}/comment/${entityId}`,
  });

  const notifications$ = createSdkObservable(
    async () =>
      (await store.dispatch('getAllNotifications', store.state.account.publicKey)).map(
        normalizeNotification,
      ),
    [],
  );

  // eslint-disable-next-line no-param-reassign
  store.state.observables = {
    notifications: notifications$,
    balance: balance$,
    topBlockHeight: createSdkObservable(async (sdk) => (await sdk.topBlock()).height, 0),
    tokenBalance: watchAsObservable(
      ({ fungibleTokens: { selectedToken } }, tokens) => tokens?.[selectedToken]?.balance,
      { immediate: true },
    ).pipe(
      pluck('newValue'),
      switchMap((p) => timer(0, 3000).pipe(map(() => p))),
      switchMap((tokenBalance) => (tokenBalance ? Promise.resolve(tokenBalance) : balance$)),
      multicast(new BehaviorSubject(asBigNumber(0))),
      refCountDelay(1000),
    ),
    balanceCurrency: watchAsObservable((state, getters) => getters.currentCurrencyRate, {
      immediate: true,
    }).pipe(
      pluck('newValue'),
      switchMap((currencyRate) => balance$.pipe(map((balance) => balance * currencyRate))),
    ),
  };
};
