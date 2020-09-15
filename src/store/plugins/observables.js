import { BehaviorSubject, timer } from 'rxjs';
import { multicast, pluck, switchMap, map } from 'rxjs/operators';
import { refCountDelay } from 'rxjs-etc/operators';
import Backend from '../../lib/backend';

export default store => {
  const watchAsObservable = (getter, options) =>
    // eslint-disable-next-line no-underscore-dangle
    store._watcherVM.$watchAsObservable(() => getter(store.state, store.getters), options);

  const sdk$ = watchAsObservable(({ sdk }) => (sdk && sdk.then ? null : sdk), {
    immediate: true,
  }).pipe(pluck('newValue'));

  const createSdkObservable = (func, def) =>
    sdk$.pipe(
      switchMap(sdk => timer(0, 30000).pipe(map(() => sdk))),
      switchMap(async sdk => (sdk ? func(sdk) : def)),
      multicast(new BehaviorSubject(def)),
      refCountDelay(1000),
    );

  const normalizeNotification = async ({ entityId, entityType, ...otherNotification }) => {
    const record =
      entityType === 'TIP'
        ? await Backend.getCacheTipById(entityId)
        : await Backend.getCommentById(entityId);

    return {
      entityId,
      entityType,
      ...otherNotification,
      sender: entityType === 'TIP' ? record.sender : record.author,
      chainName: entityType === 'TIP' ? record.chainName : record.Profile.preferredChainName,
      path:
        entityType === 'TIP'
          ? `https://superhero.com/tip/${record.id}`
          : `https://superhero.com/tip/${record.tipId}/comment/${record.id}`,
    };
  };

  const notifications$ = createSdkObservable(
    async sdk =>
      // eslint-disable-next-line no-return-await
      await Promise.all(
        (
          await Backend.getAllNotifications(store.state.account.publicKey, async data =>
            Buffer.from(await sdk.signMessage(data)).toString('hex'),
          )
        ).map(normalizeNotification),
      ),
    [],
  );

  // eslint-disable-next-line no-param-reassign
  store.state.observables = { notifications: notifications$ };
};
