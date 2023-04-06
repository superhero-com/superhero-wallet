import { computed } from 'vue';
import store from '../store';

export const useGetter = <T = any>(name: string) => computed<T>(() => store.getters[name]);

export const useState = <T = any>(nameOrModule: string, subName?: string) => computed<T>(
  () => (subName)
    ? (store.state as any)[nameOrModule][subName]
    : (store.state as any)[nameOrModule],
);

export const useDispatch = (type: string) => (payload?: any) => store.dispatch(type, payload);
