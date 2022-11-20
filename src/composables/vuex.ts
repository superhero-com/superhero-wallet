import { computed } from '@vue/composition-api';
import store from '../store';

export const useGetter = <T = any>(name: string) => computed<T>(() => store.getters[name]);

export const useState = <T = any>(name: string) => {
  const state = store.state as any;

  return computed<T>(() => state[name]);
};
