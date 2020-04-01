// eslint-disable-next-line import/prefer-default-export
export const getAccounts = async () => {
  const { subaccounts } = await browser.storage.local.get('subaccounts');

  return subaccounts ? subaccounts.filter(s => s.publicKey) : [];
};
