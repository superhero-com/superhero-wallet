export default async (store) => {
  let pollDefaultNames;
  let pollCurrencies;

  store.watch(
    (state, { wallet }) => wallet,
    async () => {
      clearInterval(pollDefaultNames);
      clearInterval(pollCurrencies);

      pollDefaultNames = setInterval(() => store.dispatch('names/setDefaults'), 10000);
      pollCurrencies = await store.dispatch('pollCurrencies');
    },
  );
};
