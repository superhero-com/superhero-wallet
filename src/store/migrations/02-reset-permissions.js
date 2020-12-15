export default async (state) => {
  const newState = { ...state };
  newState.permissions = {};
  return newState;
};
