import {
  Observable, BehaviorSubject, combineLatest, timer, of, concat,
} from 'rxjs';
import {
  multicast, pluck, switchMap, map, filter, pairwise, startWith, catchError,
} from 'rxjs/operators';
import { refCountDelay } from 'rxjs-etc/operators';
import { memoize } from 'lodash-es';
import BigNumber from 'bignumber.js';
import { MAGNITUDE } from './constants';
import {currencyAmount, prefixedAmount, fetchJson, handleUnknownError, isAccountNotFoundError } from './helper';

export default (store) => {
  // eslint-disable-next-line no-underscore-dangle
  const watchAsObservable = (getter, options) => store._watcherVM.$watchAsObservable(
    () => getter(store.state, store.getters),
    options,
  );

  const sdk$ = watchAsObservable(({ sdk }) => (sdk && sdk.then ? null : sdk), { immediate: true })
    .pipe(
      pluck('newValue'),
    );

  const defaultAccountInfo = { balance: BigNumber(0), nonce: 0 };

  const getAccountInfo = memoize(address => sdk$
    .pipe(
      switchMap(sdk => timer(0, 3000).pipe(map(() => sdk))),
      switchMap(sdk => (sdk
        ? sdk.api.getAccountByPubkey(address).catch((error) => {
          if (!isAccountNotFoundError(error)) {
            handleUnknownError(error);
          }
          return defaultAccountInfo;
        })
        : Promise.resolve(defaultAccountInfo))),
      map(aci => ({ ...aci, balance: BigNumber(aci.balance).shiftedBy(-MAGNITUDE) })),
      multicast(new BehaviorSubject(defaultAccountInfo)),
      refCountDelay(1000),
    ));

  const getAccounts = accountsGetter => watchAsObservable(accountsGetter, { immediate: true })
    .pipe(
      pluck('newValue'),
      switchMap(acs => (acs.length
        ? combineLatest(acs.map(({ address }) => getAccountInfo(address)))
          .pipe(map(acis => acis.map((aci, idx) => ({ ...acs[idx], ...aci }))))
        : of([]))),
    );

  const accounts$ = getAccounts(({ accounts: { list } }) => list);

  const normalizeTransaction = async ({
    blockHash, time, tx: { amount, fee, ...otherTx }, ...otherTransaction
  }) => ({
    ...otherTransaction,
    blockHash,
    ...blockHash !== 'none' && {
      time: new Date(
        time || (await store.state.sdk.api.getMicroBlockHeaderByHash(blockHash)).time,
      ),
    },
    tx: {
      ...otherTx,
      ...amount !== undefined && { amount: BigNumber(amount).shiftedBy(-MAGNITUDE) },
      fee: BigNumber(fee).shiftedBy(-MAGNITUDE),
    },
  });

  const setTransactionFieldsRelatedToAddress = ({ tx, ...otherTransaction }, currentAddress) => ({
    ...otherTransaction,
    received: currentAddress === tx.recipientId,
    peerId: currentAddress === tx.recipientId
      ? tx.senderId
      : tx.recipientId,
    tx,
  });

  const topBlockHeight$ = sdk$
    .pipe(
      switchMap(sdk => timer(0, 30000).pipe(map(() => sdk))),
      switchMap(async sdk => (sdk ? (await sdk.topBlock()).height : 0)),
      multicast(new BehaviorSubject(0)),
      refCountDelay(1000),
    );

  const activeAccountAddress$ = watchAsObservable(
    (state, getters) => getters['accounts/active'].address, { immediate: true },
  )
    .pipe(pluck('newValue'));

  const referenceCurrency = 'aeternity';

  const rate$ = watchAsObservable(
    ({ currencies: { activeCode } }) => activeCode,
    { immediate: true },
  )
    .pipe(
      pluck('newValue'),
      switchMap(p => timer(0, 60000).pipe(map(() => p))),
      switchMap(async (activeCode) => {
        const url = new URL('https://api.coingecko.com/api/v3/simple/price');
        url.searchParams.set('ids', referenceCurrency);
        url.searchParams.set('vs_currencies', activeCode);
        return (await fetchJson(url))[referenceCurrency][activeCode];
      }),
      multicast(new BehaviorSubject(0)),
      refCountDelay(1000),
    );

  const convertAmount = (amountAeGetter, overrideSwapped) => watchAsObservable(
    ({ currencies }, getters) => ({
      amount: amountAeGetter(),
      swapped: overrideSwapped !== undefined ? overrideSwapped : currencies.swapped,
      active: getters['currencies/active'],
    }),
    { immediate: true },
  )
    .pipe(
      pluck('newValue'),
      switchMap(args => (args.swapped
        ? rate$.pipe(map(rate => ({ ...args, amount: args.amount.multipliedBy(rate) })))
        : Promise.resolve(args))),
      map(({ swapped, amount, active }) => currencyAmount(
        ...swapped ? [amount, active] : [prefixedAmount(amount), { symbol: 'AE' }],
      )),
    );

  let transactions = {};
  let transactionRangeForAddress = {};

  sdk$.subscribe(() => {
    transactions = {};
    transactionRangeForAddress = {};
  });

  const registerTx = (tx) => { transactions[tx.hash] = tx; };

  const addConvertedAmount = tx => (tx.tx.amount
    ? convertAmount(() => tx.tx.amount)
      .pipe(map(convertedAmount => ({ ...tx, convertedAmount })))
    : Promise.resolve(tx));

  const getTransaction = transactionHash$ => combineLatest([
    activeAccountAddress$, topBlockHeight$, transactionHash$, sdk$,
  ]).pipe(
      switchMap(async ([address, height, hash, sdk]) => {
        let tx;
        if (transactions[hash]) {
          tx = transactions[hash];
        } else {
          if (!sdk) return null;
          tx = await normalizeTransaction(
            await sdk.api.getTransactionByHash(hash),
          );
          registerTx(tx);
        }
        return {
          ...setTransactionFieldsRelatedToAddress(tx, address),
          confirmationCount: height - tx.blockHeight,
        };
      }),
      switchMap(tx => (tx ? addConvertedAmount(tx) : Promise.resolve(tx))),
    );

  const fetchMdwTransactions = async (address, limit, page) => {
    if (store.state.sdk.then) await store.state.sdk;
    const txs = await Promise.all(
      (await store.state.sdk.middleware.getTxByAccount(address, { limit, page }))
        .map(normalizeTransaction),
    );
    txs.forEach(registerTx);
    return txs;
  };

  const fetchPendingTransactions = async (address) => {
    if (store.state.sdk.then) await store.state.sdk;
    const txs = await Promise.all((
      await store.state.sdk.api.getPendingAccountTransactionsByPubkey(address)
        .then(
          r => r.transactions,
          (error) => {
            if (!isAccountNotFoundError(error)) {
              handleUnknownError(error);
            }
            return [];
          },
        )
    )
      .map(transaction => ({ ...transaction, pending: true }))
      .map(normalizeTransaction));
    txs.forEach(registerTx);
    return txs;
  };

  const getTransactionsByAddress = (address) => {
    if (!transactionRangeForAddress[address]) return [];
    const txs = Object.values(transactions)
      .filter(({ tx }) => Object.values(tx).includes(address));
    const minedTxs = txs
      .filter(({ pending }) => !pending)
      .sort((a, b) => b.time - a.time);
    const { begin, end } = transactionRangeForAddress[address];
    const beginIdx = minedTxs.findIndex(({ hash }) => hash === begin);
    const endIdx = minedTxs.findIndex(({ hash }) => hash === end);
    return [
      ...txs.filter(({ pending }) => pending),
      ...minedTxs.slice(beginIdx, endIdx - beginIdx + 1),
    ].map(tx => setTransactionFieldsRelatedToAddress(tx, address));
  };

  const getTransactionList = (loadMore$) => {
    const limit = 15;
    let lastValue;
    return concat(
      of([]),
      combineLatest([
        concat(of('initial'), loadMore$.pipe(map(() => 'loadMore'))),
        activeAccountAddress$,
        sdk$,
      ]),
    )
      .pipe(
        pairwise(),
        map(([[, oldAddress, oldSdk], [mode, address, sdk]]) => ({
          address, mode: oldAddress === address && oldSdk === sdk ? mode : 'initial',
        })),
        filter(({ mode }) => mode === 'initial' || (lastValue && lastValue.status === '')),
        switchMap(({ address, mode }) => timer(0, 30000)
          .pipe(map(idx => ({ address, mode: idx ? 'poll' : mode })))),
        switchMap(({ address, mode }) => new Observable(async (subscriber) => {
          try {
            const next = (status = '') => {
              lastValue = {
                list: getTransactionsByAddress(address),
                status: (transactionRangeForAddress[address] || {}).ended ? 'ended' : status,
              };
              subscriber.next(lastValue);
            };

            switch (mode) {
              case 'initial': {
                if (!transactionRangeForAddress[address]) {
                  next('loading');
                  const [txs] = await Promise.all([
                    fetchMdwTransactions(address, limit, 1),
                    fetchPendingTransactions(address),
                  ]);
                  transactionRangeForAddress[address] = {
                    ...txs.length && {
                      begin: txs[0].hash,
                      end: txs[txs.length - 1].hash,
                    },
                    ended: txs.length !== limit,
                  };
                  next();
                  break;
                }
              }
              case 'poll': // eslint-disable-line no-fallthrough
                await Promise.all([
                  fetchMdwTransactions(address, 1, 1).then(async ([tx]) => {
                    if (!tx) return;
                    const range = transactionRangeForAddress[address];
                    const begin = tx.hash;
                    let end = tx.hash;
                    let t = tx;
                    let p = 1;
                    while (t && t.hash !== range.begin) {
                      // eslint-disable-next-line no-await-in-loop
                      [t] = await fetchMdwTransactions(address, 1, p += 1);
                      if (t) end = t.hash;
                    }
                    Object.assign(range, { begin, end: range.end || end });
                  }),
                  fetchPendingTransactions(address),
                ]);
                next();
                break;
              case 'loadMore': {
                if (transactionRangeForAddress[address].ended) break;
                next('loading');
                const loadedCount = 1 + lastValue.list
                  .findIndex(({ hash }) => transactionRangeForAddress[address].end === hash);
                const txs = await fetchMdwTransactions(
                  address,
                  limit,
                  Math.floor(loadedCount / limit) + 1,
                );
                Object.assign(transactionRangeForAddress[address], {
                  end: txs[txs.length - 1].hash,
                  ended: txs.length !== limit,
                });
                next();
                break;
              }
              default:
                throw new Error(`Invalid mode: ${mode}`);
            }

            subscriber.complete();
          } catch (error) {
            subscriber.error(error);
          }
        })),
        switchMap(({ list, ...other }) => (list.length
          ? combineLatest(list.map(addConvertedAmount)).pipe(map(txs => ({ list: txs, ...other })))
          : Promise.resolve({ list: [], ...other }))),
        startWith({
          list: getTransactionsByAddress(store.getters['accounts/active'].address)
            .map(tx => ({
              ...tx,
              ...tx.tx.amount && {
                convertedAmount: currencyAmount(prefixedAmount(tx.tx.amount), { symbol: 'AE' }),
              },
            })),
          status: '',
        }),
        catchError((error) => {
          handleUnknownError(error);
          return of({ list: [], status: 'error' });
        }),
      );
  };

  store.state.observables = { // eslint-disable-line no-param-reassign
    topBlockHeight: topBlockHeight$,
    getTransaction,
    getTransactionList,
    activeAccount: watchAsObservable(
      (state, getters) => getters['accounts/active'],
      { immediate: true, deep: true },
    )
      .pipe(
        pluck('newValue'),
        switchMap(acc => (acc
          ? getAccountInfo(acc.address).pipe(map(acci => ({ ...acc, ...acci })))
          : of(acc))),
      ),
    accounts: accounts$,
    inactiveAccounts: getAccounts(
      ({ accounts: { list, activeIdx } }) => [
        ...list.slice(0, activeIdx),
        ...list.slice(activeIdx + 1),
      ],
    ),
    getAccounts,
    totalBalance: accounts$.pipe(
      map(acs => acs.reduce((prev, { balance }) => prev.plus(balance), BigNumber(0))),
    ),
    rate: rate$,
    convertAmount,
  };
};
