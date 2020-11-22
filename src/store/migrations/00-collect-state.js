export default async (state) => {
  const {
    userAccount: account,
    subaccounts,
    mnemonic,
    backed_up_Seed: backedUpSeed,
  } = await browser.storage.local.get(['userAccount', 'subaccounts', 'mnemonic', 'backed_up_Seed']);

  return {
    ...state,
    account,
    subaccounts,
    mnemonic,
    backedUpSeed,
  };
};
