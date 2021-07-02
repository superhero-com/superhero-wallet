export default (state) => {
  const newState = { ...state };
  if (!newState.fungibleTokens.tokens) newState.fungibleTokens.tokens = {};
  return newState;
};
