export default (state) => {
  const newState = { ...state };
  if (!newState.names.preferred) newState.names.preferred = {};
  return newState;
};
