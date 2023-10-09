import { IHistoryItem } from '@/types';
import { STORAGE_KEYS, MAX_BROWSER_HISTORY_ITEMS } from '@/constants';
import { useStorageRef } from './storageRef';

const history = useStorageRef<IHistoryItem[]>(
  [],
  STORAGE_KEYS.appsBrowserHistory,
);

export function useAppsBrowserHistory() {
  function getCleanPath(url: string) {
    const { hostname, pathname } = new URL(url);
    return `${hostname}${pathname}`;
  }

  function addHistoryItem(item: IHistoryItem) {
    const cleanPath = getCleanPath(item.url);
    const newHistory = history.value.filter((historyItem) => historyItem.cleanPath !== cleanPath);

    newHistory.unshift({
      ...item,
      cleanPath,
    });

    if (newHistory.length > MAX_BROWSER_HISTORY_ITEMS) {
      newHistory.pop();
    }
    history.value = newHistory;
  }

  return {
    history,
    addHistoryItem,
  };
}
