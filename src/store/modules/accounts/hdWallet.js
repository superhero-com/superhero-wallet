import {
  sign,
  unpackTx,
  Tag,
  decode,
  buildTx,
} from '@aeternity/aepp-sdk-13';

import { useModals, useSdk13 } from '../../../composables';
import {
  ACCOUNT_HD_WALLET,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  getHdWalletAccount,
  isTxOfASupportedType,
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
    async isAccountUsed(context, address) {
      const { getSdk } = useSdk13({ store: context });
      const sdk = await getSdk();
      return sdk.api.getAccountByPubkey(address).then(() => true, () => false);
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
    signWithoutConfirmation({ rootGetters: { accounts, account } }, { data, options }) {
      const { secretKey } = options && options.onAccount
        ? accounts.find(({ address }) => address === options.onAccount)
        : account;
      return sign(data, secretKey);
    },
    async confirmRawDataSigning(context, { data, app }) {
      const { openModal } = useModals();
      await openModal(MODAL_CONFIRM_RAW_SIGN, { data, app });
    },
    async confirmTxSigning({ dispatch }, { txBase64, app }) {
      if (!isTxOfASupportedType(txBase64)) {
        await dispatch('confirmRawDataSigning', { data: txBase64, app });
        return;
      }
      const txObject = unpackTx(txBase64);

      const checkTransactionSignPermission = await dispatch('permissions/checkTransactionSignPermission', {
        ...txObject,
        host: app?.host || null,
      }, { root: true });

      if (!checkTransactionSignPermission) {
        const { openModal } = useModals();
        await openModal(MODAL_CONFIRM_TRANSACTION_SIGN, { tx: txObject });
      }
    },
    sign({ dispatch }, data) {
      return dispatch('signWithoutConfirmation', { data });
    },
    async signTransaction({ dispatch, rootGetters }, {
      txBase64,
      options: { modal = true, app = null },
    }) {
      const encodedTx = decode(txBase64, 'tx');
      if (modal) {
        await dispatch('confirmTxSigning', { txBase64, app });
      }
      const signature = await dispatch(
        'signWithoutConfirmation',
        {
          data: Buffer.concat([
            Buffer.from(rootGetters.activeNetwork.networkId),
            Buffer.from(encodedTx),
          ]),
        },
      );
      return buildTx({ tag: Tag.SignedTx, encodedTx, signatures: [signature] });
    },
    async signTransactionFromAccount({ dispatch, rootGetters }, {
      txBase64,
      options: { modal = true, app = null, onAccount },
    }) {
      const encodedTx = decode(txBase64, 'tx');
      if (modal) {
        await dispatch('confirmTxSigning', { txBase64, app });
      }
      const signature = await dispatch(
        'signWithoutConfirmation',
        {
          data: Buffer.concat([
            Buffer.from(rootGetters.activeNetwork.networkId),
            Buffer.from(encodedTx),
          ]),
          options: { onAccount },
        },
      );
      return buildTx({ tag: Tag.SignedTx, encodedTx, signatures: [signature] });
    },
  },
};
