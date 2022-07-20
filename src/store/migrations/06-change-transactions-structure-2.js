export default (state) => {
  const newState = { ...state };
  if (Array.isArray(newState.transactions.pending)) newState.transactions.pending = {};
  return newState;
};
