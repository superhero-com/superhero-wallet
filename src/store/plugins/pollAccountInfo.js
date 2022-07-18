export default async (store) => {
  let pollAvailableTokens;
  let pollTokenBalances;
  let pollDefaultNames;
  let pollCurrencies;

  store.watch(
    (state, { wallet }) => wallet,
    async () => {
      clearInterval(pollDefaultNames);
      clearInterval(pollAvailableTokens);
      clearInterval(pollTokenBalances);
      clearInterval(pollCurrencies);

      pollDefaultNames = setInterval(() => store.dispatch('names/setDefaults'), 10000);
      pollAvailableTokens = setInterval(() => store.dispatch('fungibleTokens/getAvailableTokens'), 60000);
      pollTokenBalances = setInterval(() => store.dispatch('fungibleTokens/loadTokenBalances'), 10000);
      pollCurrencies = await store.dispatch('pollCurrencies');
    },
  );
};
