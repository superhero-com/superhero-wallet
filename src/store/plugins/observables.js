import { BehaviorSubject, timer, combineLatest } from 'rxjs';
import {
  multicast, pluck, switchMap, map, filter,
} from 'rxjs/operators';
import { refCountDelay } from 'rxjs-etc/operators';
import { memoize } from 'lodash-es';
import BigNumber from 'bignumber.js';
import {
  isNotFoundError,
  handleUnknownError,
  aettosToAe,
  setBalanceLocalStorage,
  getBalanceLocalStorage,
} from '../../popup/utils/helper';

export default (store) => {
  // eslint-disable-next-line no-underscore-dangle
  const watchAsObservable = (getter, options) => store._watcherVM
    .$watchAsObservable(() => getter(store.state, store.getters), options);

  const sdk$ = watchAsObservable(({ sdk }) => sdk, { immediate: true }).pipe(
    pluck('newValue'),
    filter((sdk) => sdk),
  );

  const createSdkObservable = (func, def) => sdk$.pipe(
    switchMap((sdk) => timer(0, 30000).pipe(map(() => sdk))),
    switchMap(async (sdk) => (sdk ? func(sdk) : def)),
    multicast(new BehaviorSubject(def)),
    refCountDelay(1000),
  );

  const getAccountBalance = memoize((address) => sdk$.pipe(
    switchMap((sdk) => timer(0, 3000).pipe(map(() => sdk))),
    switchMap((sdk) => sdk.balance(address).catch((error) => {
      if (!isNotFoundError(error)) {
        handleUnknownError(error);
      }
      return 0;
    })),
    map((balanceAettos) => {
      const balance = aettosToAe(balanceAettos);
      let storageBalance = getBalanceLocalStorage();
      if (typeof storageBalance === 'string') storageBalance = {}; // Previously string was stored
      if (balance !== storageBalance[address]) {
        storageBalance[address] = balance;
        setBalanceLocalStorage(storageBalance);
      }
      return new BigNumber(balance);
    }),
    multicast(new BehaviorSubject(new BigNumber(getBalanceLocalStorage()[address] || 0))),
    refCountDelay(1000),
  ));

  const balance$ = watchAsObservable(
    ({ accounts: { accountSelectedIdx } }, { accounts }) => accounts[accountSelectedIdx],
    {
      immediate: true,
    },
  ).pipe(
    pluck('newValue'),
    switchMap(({ address }) => getAccountBalance(address)),
  );

  const balances$ = watchAsObservable((state, getters) => getters.accounts, {
    immediate: true,
  }).pipe(
    pluck('newValue'),
    switchMap((acs) => (acs.length
      ? combineLatest(acs.map(({ address }) => getAccountBalance(address)))
      : Promise.resolve([]))),
  );

  const normalizeNotification = ({
    entityId, sourceId, entityType, sender, ...other
  }) => ({
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
    async () => (await store.dispatch('getAllNotifications')).map(normalizeNotification),
    [],
  );

  // eslint-disable-next-line no-param-reassign
  store.state.observables = {
    notifications: notifications$,
    balance: balance$,
    balances: balances$,
    topBlockHeight: createSdkObservable(async (sdk) => (await sdk.topBlock()).height, 0),
    tokenBalance: watchAsObservable(
      ({ fungibleTokens: { selectedToken } }, tokens) => tokens?.[selectedToken]?.balance,
      { immediate: true },
    ).pipe(
      pluck('newValue'),
      switchMap((p) => timer(0, 3000).pipe(map(() => p))),
      switchMap((tokenBalance) => (tokenBalance ? Promise.resolve(tokenBalance) : balance$)),
      multicast(new BehaviorSubject(new BigNumber(0))),
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
