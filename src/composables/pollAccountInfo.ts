import { IDefaultComposableOptions } from '@/types';
import { useFungibleTokens } from './fungibleTokens';

let isInitialized = false;
let pollAvailableTokens: NodeJS.Timer;
let pollTokenBalances: NodeJS.Timer;
let pollDefaultNames: NodeJS.Timer;

export function usePollAccountInfo({ store }: IDefaultComposableOptions) {
  const {
    loadTokenBalances,
    loadAvailableTokens,
  } = useFungibleTokens();

  function stopPolling() {
    clearInterval(pollDefaultNames);
    clearInterval(pollAvailableTokens);
    clearInterval(pollTokenBalances);
  }

  function startPolling() {
    pollDefaultNames = setInterval(() => store.dispatch('names/setDefaults'), 10000);
    pollAvailableTokens = setInterval(() => loadAvailableTokens(), 60000);
    pollTokenBalances = setInterval(() => loadTokenBalances(), 10000);
  }

  function handleVisibilityChange(event: Event) {
    const isHidden = (event.target as any).hidden;
    if (isHidden) {
      stopPolling();
    } else {
      startPolling();
    }
  }

  (() => {
    if (!isInitialized) {
      startPolling();
      document.addEventListener('visibilitychange', (event) => handleVisibilityChange(event));
      isInitialized = true;
    }
  })();

  return {};
}
