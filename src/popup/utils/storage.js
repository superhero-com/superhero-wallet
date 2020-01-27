export const getAccounts = async () => {
    let accounts = await browser.storage.local.get('subaccounts')

   return Object.keys(accounts).length ? accounts : { subaccounts: [] }
}