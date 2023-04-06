import { ref } from 'vue';
import { ROUTE_ACCOUNT } from '../popup/router/routeNames';
import type { IDefaultComposableOptions } from '../types';

const homeRouteName = ref(ROUTE_ACCOUNT);

export function useUi({ store }: IDefaultComposableOptions) {
  function setHomeRouteName(routeName: string) {
    if (homeRouteName.value !== routeName) {
      homeRouteName.value = routeName;
      store.commit('initTransactions');
    }
  }

  return {
    homeRouteName,
    setHomeRouteName,
  };
}
