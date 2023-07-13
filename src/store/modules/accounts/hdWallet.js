import { Crypto, TxBuilder, SCHEMA } from '@aeternity/aepp-sdk';
import { encode, unpackTx } from '@aeternity/aepp-sdk-13';
import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';
import {
  useModals,
  useSdk13,
} from '../../../composables';
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
    signWithoutConfirmation({ rootGetters: { accounts, account } }, { data, opt }) {
      const { secretKey } = opt && opt.onAccount
        ? accounts.find(({ address }) => address === opt.onAccount)
        : account;
      return Crypto.sign(data, secretKey);
    },
    async confirmRawDataSigning(context, { data, app }) {
      const { openModal } = useModals();
      await openModal(MODAL_CONFIRM_RAW_SIGN, { data, app });
    },
    async confirmTxSigning({ dispatch }, { encodedTx, app }) {
      if (!isTxOfASupportedType(encodedTx)) {
        await dispatch('confirmRawDataSigning', { data: encodedTx, app });
        return;
      }
      const txObject = unpackTx(encode(encodedTx, 'tx'));

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
      opt: { modal = true, app = null },
    }) {
      const encodedTx = decode(txBase64, 'tx');
      if (modal) {
        await dispatch('confirmTxSigning', { encodedTx, app });
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
      return TxBuilder.buildTx({ encodedTx, signatures: [signature] }, SCHEMA.TX_TYPE.signed).tx;
    },
    async signTransactionFromAccount({ dispatch, rootGetters }, {
      txBase64,
      opt: { modal = true, app = null, onAccount },
    }) {
      const encodedTx = decode(txBase64, 'tx');
      if (modal) {
        await dispatch('confirmTxSigning', { encodedTx, app });
      }
      const signature = await dispatch(
        'signWithoutConfirmation',
        {
          data: Buffer.concat([
            Buffer.from(rootGetters.activeNetwork.networkId),
            Buffer.from(encodedTx),
          ]),
          opt: { onAccount },
        },
      );
      return TxBuilder.buildTx({ encodedTx, signatures: [signature] }, SCHEMA.TX_TYPE.signed).tx;
    },
  },
};
