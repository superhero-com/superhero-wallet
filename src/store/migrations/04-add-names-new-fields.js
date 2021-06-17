export default (state) => {
  const newState = { ...state };
  if (!newState.names.preferred) newState.names.preferred = {};
  if (!newState.names.auctions) newState.names.auctions = {};
  if (!newState.names.pendingAutoExtendNames) newState.names.pendingAutoExtendNames = [];
  return newState;
};
