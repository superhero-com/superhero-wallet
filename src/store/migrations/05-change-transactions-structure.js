export default (state) => {
  const newState = { ...state };
  if (!newState.transactions.loaded) newState.transactions.loaded = [];
  if (!newState.transactions.nextPageUrl) newState.transactions.nextPageUrl = '';
  return newState;
};
