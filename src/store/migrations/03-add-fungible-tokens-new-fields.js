export default (state) => {
  const newState = { ...state };
  if (!newState.fungibleTokens.tokens) newState.fungibleTokens.tokens = {};
  if (!newState.fungibleTokens.transactions) newState.fungibleTokens.transactions = {};
  return newState;
};
