import {
  sign,
  unpackTx,
  Tag,
  decode,
  buildTx,
} from '@aeternity/aepp-sdk';
import {
  ACCOUNT_HD_WALLET,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  getHdWalletAccount,
} from '../../../popup/utils';

export default {
  namespaced: true,

  account: {
    type: ACCOUNT_HD_WALLET,
  },

  state: {
    nextAccountIdx: 1,
  },
  actions: {
    async isAccountUsed({ rootGetters }, address) {
      return rootGetters['sdkPlugin/sdk'].api.getAccountByPubkey(address).then(() => true, () => false);
    },
    async discover({ state, rootGetters, dispatch }) {
      let lastNotEmptyIdx = 0;
      let account;
      // eslint-disable-next-line no-plusplus
      for (let nextIdx = state.nextAccountIdx; nextIdx <= 5; nextIdx++) {
        account = getHdWalletAccount(rootGetters.wallet, nextIdx);
        // eslint-disable-next-line no-await-in-loop
        if (await dispatch('isAccountUsed', account.address)) lastNotEmptyIdx = nextIdx;
      }
      // eslint-disable-next-line no-plusplus
      for (let i = state.nextAccountIdx; i <= lastNotEmptyIdx; i++) {
        dispatch('create', true);
      }
    },
    create({ state, commit }, isRestored = false) {
      commit(
        'accounts/add',
        { idx: state.nextAccountIdx, type: ACCOUNT_HD_WALLET, isRestored },
        { root: true },
      );
      state.nextAccountIdx += 1;
    },
    signWithoutConfirmation({ rootGetters: { account } }, data) {
      return sign(data, account.secretKey);
    },
    async confirmRawDataSigning({ dispatch }, data) {
      await dispatch('modals/open', { name: MODAL_CONFIRM_RAW_SIGN, data }, { root: true });
    },
    async confirmTxSigning({ dispatch }, { txBase64, host }) {
      let txObject;
      try {
        txObject = unpackTx(txBase64).tx;
      } catch (e) {
        await dispatch('confirmRawDataSigning', txBase64);
        return;
      }
      const SUPPORTED_TX_TYPES = [
        Tag.SpendTx,
        Tag.ContractCreateTx,
        Tag.ContractCallTx,
        Tag.NamePreclaimTx,
        Tag.NameClaimTx,
        Tag.NameUpdateTx,
        Tag.NameTransferTx,
      ];
      if (!SUPPORTED_TX_TYPES.includes(txObject.tag)) {
        await dispatch('confirmRawDataSigning', txBase64);
        return;
      }

      const checkTransactionSignPermission = await dispatch('permissions/checkTransactionSignPermission', {
        ...txObject,
        host,
      }, { root: true });

      if (!checkTransactionSignPermission) {
        await dispatch(
          'modals/open',
          { name: MODAL_CONFIRM_TRANSACTION_SIGN, transaction: txObject },
          { root: true },
        );
      }
    },
    sign({ dispatch }, data) {
      return dispatch('signWithoutConfirmation', data);
    },
    async signTransaction({ dispatch }, {
      txBase64,
      options: { modal = true, host = null },
    }) {
      const encodedTx = decode(txBase64, 'tx');
      if (modal) await dispatch('confirmTxSigning', { txBase64, host });
      const signature = await dispatch(
        'signWithoutConfirmation',
        Buffer.concat([Buffer.from(await this.getters['sdkPlugin/sdk'].api.getNetworkId()), Buffer.from(encodedTx)]),
      );
      return buildTx({ encodedTx, signatures: [signature] }, Tag.SignedTx).tx;
    },
  },
};
