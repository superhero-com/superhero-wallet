export default (state) => {
  const newState = { ...state };
  if (newState.invites.invites?.length) {
    newState.invites.invites = newState.invites.invites
      .map((invite) => ({
        ...invite,
        secretKey: Buffer.from(invite.secretKey, 'hex').slice(0, 32),
      }));
  }
  return newState;
};
