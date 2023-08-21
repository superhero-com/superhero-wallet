import {
  sign,
  unpackTx,
  Tag,
  decode,
  buildTx,
} from '@aeternity/aepp-sdk';

import { useAccounts, useModals, useAeSdk } from '../../../composables';
import {
  ACCOUNT_HD_WALLET,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  getHdWalletAccount,
  isTxOfASupportedType,
} from '../../../popup/utils';

/**
 * Address gap limit is currently set to 5.
 * If the software hits 5 unused addresses in a row,
 * it expects there are no used addresses beyond this point and stops searching the address chain.
*/
const ADDRESS_GAP_LIMIT = 5;

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
      const { getAeSdk } = useAeSdk({ store: context });
      const aeSdk = await getAeSdk();
      return aeSdk.api.getAccountByPubkey(address).then(() => true, () => false);
    },
    async discover({ state, rootGetters, dispatch }) {
      let lastNotEmptyIdx = 0;
      let lastIndex = 0;
      let isAccountUsedArray = [];

      do {
        try {
          lastNotEmptyIdx = isAccountUsedArray.lastIndexOf(true) + lastIndex;
          lastIndex += isAccountUsedArray.length;
          // eslint-disable-next-line no-await-in-loop
          isAccountUsedArray = await Promise.all(
            Array(ADDRESS_GAP_LIMIT + lastNotEmptyIdx - lastIndex + 1)
              // eslint-disable-next-line no-loop-func
              .fill().map((x, i) => i + lastIndex).map((index) => dispatch(
                'isAccountUsed',
                getHdWalletAccount(rootGetters.wallet, index).address,
              )),
          );
        } catch (e) {
          break;
        }
      } while (!(
        isAccountUsedArray.lastIndexOf(true) === -1
        || isAccountUsedArray.filter((isAccountUsed) => !isAccountUsed).length === ADDRESS_GAP_LIMIT
      ));
      for (let i = state.nextAccountIdx; i <= lastNotEmptyIdx; i += 1) {
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
    signWithoutConfirmation({ rootState, rootGetters }, { data, options }) {
      const { activeAccount, getAccountByAddress } = useAccounts({
        store: { state: rootState, getters: rootGetters },
      });
      const { secretKey } = (options?.fromAccount)
        ? getAccountByAddress(options.fromAccount)
        : activeAccount.value;
      return sign(data, secretKey);
    },
    async confirmTxSigning({ dispatch }, { txBase64, app }) {
      const { openModal } = useModals();

      if (!isTxOfASupportedType(txBase64)) {
        await openModal(MODAL_CONFIRM_RAW_SIGN, { data: txBase64, app });
        return;
      }
      const txObject = unpackTx(txBase64);

      const checkTransactionSignPermission = await dispatch('permissions/checkTransactionSignPermission', {
        ...txObject,
        host: app?.host || null,
      }, { root: true });

      if (!checkTransactionSignPermission) {
        await openModal(MODAL_CONFIRM_TRANSACTION_SIGN, { tx: txObject, txBase64 });
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
      options: { modal = true, app = null, fromAccount },
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
          options: { fromAccount },
        },
      );
      return buildTx({ tag: Tag.SignedTx, encodedTx, signatures: [signature] });
    },
  },
};
