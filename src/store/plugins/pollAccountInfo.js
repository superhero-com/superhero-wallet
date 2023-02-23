export default async (store) => {
  let pollAvailableTokens;
  let pollTokenBalances;
  let pollDefaultNames;

  store.watch(
    (state, { wallet }) => wallet,
    async () => {
      clearInterval(pollDefaultNames);
      clearInterval(pollAvailableTokens);
      clearInterval(pollTokenBalances);

      pollDefaultNames = setInterval(() => store.dispatch('names/setDefaults'), 10000);
      pollAvailableTokens = setInterval(() => store.dispatch('fungibleTokens/loadAvailableTokens'), 60000);
      pollTokenBalances = setInterval(() => store.dispatch('fungibleTokens/loadTokenBalances'), 10000);
    },
  );
};
