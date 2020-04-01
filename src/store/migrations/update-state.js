export default {
  migrate(state, store) {
    return new Promise(async resolve => {
      const { commit, dispatch } = store;
      const { userAccount } = await browser.storage.local.get('userAccount');
      const { subaccounts } = await browser.storage.local.get('subaccounts');
      const { mnemonic } = await browser.storage.local.get('mnemonic');
      // eslint-disable-next-line camelcase
      const { backed_up_Seed } = await browser.storage.local.get('backed_up_Seed');

      if (userAccount) commit('UPDATE_ACCOUNT', userAccount);
      if (subaccounts) commit('SET_SUBACCOUNTS', subaccounts);
      if (mnemonic) commit('SET_MNEMONIC', mnemonic);
      // eslint-disable-next-line camelcase
      if (backed_up_Seed) commit('SET_BACKED_UP_SEED', backed_up_Seed);

      if (process.env.RUNNING_IN_TESTS) {
        const { balance } = await browser.storage.local.get('balance');
        const { transactions } = await browser.storage.local.get('transactions');

        if (balance) commit('UPDATE_BALANCE', balance);
        if (transactions) await dispatch('setPendingTx', transactions.pending[0]);
      }
      resolve();
    });
  },
};
