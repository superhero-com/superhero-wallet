export default async (store) => {
  let pollAvailableTokens;
  let pollTokenBalances;
  let pollDefaultNames;

  function stopPolling() {
    clearInterval(pollDefaultNames);
    clearInterval(pollAvailableTokens);
    clearInterval(pollTokenBalances);
  }

  function startPolling() {
    pollDefaultNames = setInterval(() => store.dispatch('names/setDefaults'), 10000);
    pollAvailableTokens = setInterval(() => store.dispatch('fungibleTokens/loadAvailableTokens'), 60000);
    pollTokenBalances = setInterval(() => store.dispatch('fungibleTokens/loadTokenBalances'), 10000);
  }

  function handleVisibilityChange(event) {
    const isHidden = event.target.hidden;
    if (isHidden) {
      stopPolling();
    } else {
      startPolling();
    }
  }

  store.watch(
    (state, { wallet }) => wallet,
    async () => {
      stopPolling();
      startPolling();
    },
  );

  // TODO - if possible use ui.ts composable
  document.addEventListener('visibilitychange', (event) => handleVisibilityChange(event));
};
