export default (state) => {
  const newState = { ...state };
  newState.permissions = Object.fromEntries(
    ['superhero.com', 'localhost'].map((domain) => [
      domain,
      {
        addresses: [],
        address: true,
        messageSign: true,
        transactionSignLimit: 50,
        transactionSignLimitLeft: 50,
        transactionSignFirstAskedOn: null,
      },
    ]),
  );
  return newState;
};
