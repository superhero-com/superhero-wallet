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


  const notifications$ = createSdkObservable(
    async sdk =>
      await Backend.getAllNotifications(await sdk.address(), async data =>
        Buffer.from(await sdk.signMessage(data)).toString('hex'),
      ),
    [],
  );

  // eslint-disable-next-line no-param-reassign
  store.state.observables = { notifications: notifications$ };
};
