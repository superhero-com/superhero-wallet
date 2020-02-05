export const getAccounts = async () => {
  const accounts = await browser.storage.local.get('subaccounts');

  return Object.keys(accounts).length ? accounts : { subaccounts: [] };
};
