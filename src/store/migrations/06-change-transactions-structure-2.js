export default (state) => {
  const newState = { ...state };
  if (Array.isArray(newState.transactions.pending)) newState.transactions.pending = {};
  if (!newState.transactions.tipWithdrawnTransactions) {
    newState.transactions.tipWithdrawnTransactions = [];
  }
  return newState;
};
