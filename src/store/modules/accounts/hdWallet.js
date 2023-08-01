import {
  sign,
  unpackTx,
  Tag,
  decode,
  buildTx,
} from '@aeternity/aepp-sdk';

import { useModals, useAeSdk, useSdk } from '../../../composables';
import {
  ACCOUNT_HD_WALLET,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  getHdWalletAccount,
  isTxOfASupportedType,
  PROTOCOL_AETERNITY,
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
      const { getAeSdk } = useAeSdk({ store: context });
      const aeSdk = await getAeSdk();
      return aeSdk.api.getAccountByPubkey(address).then(() => true, () => false);
    },
    async discover(context) {
      const {
        state,
        rootGetters,
        dispatch,
        commit,
      } = context;

      const { getProtocols, getProtocolSdk } = useSdk({ store: context });
      let lastNotEmptyIdx = 0;
      // loop through protocols, then loop through accounts
      const protocols = getProtocols();
      // eslint-disable-next-line no-restricted-syntax, guard-for-in
      for (const protocol in protocols) {
        const protocolSDK = getProtocolSdk(protocol);
        if (protocolSDK.getAccount) {
          const checkIndexes = protocol === 'aeternity' ? 5 : 1;
          // eslint-disable-next-line no-plusplus
          for (let nextIdx = 0; nextIdx < checkIndexes; nextIdx++) {
            // eslint-disable-next-line no-await-in-loop
            const account = await protocolSDK.getAccount(nextIdx);
            commit(
              'accounts/add',
              {
                idx: state.nextAccountIdx,
                // type: ACCOUNT_HD_WALLET,
                isRestored: true,
                ...account,
              },
              { root: true },
            );
            state.nextAccountIdx += 1;
          }
        }
      }
      if (false) {
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
      }
    },
    create({ state, commit }, isRestored = false) {
      commit(
        'accounts/add',
        {
          idx: state.nextAccountIdx,
          type: ACCOUNT_HD_WALLET,
          isRestored,
          protocol: PROTOCOL_AETERNITY,
        },
        { root: true },
      );
      state.nextAccountIdx += 1;
    },
    signWithoutConfirmation({ rootGetters: { accounts, account } }, { data, options }) {
      const { secretKey } = options && options.fromAccount
        ? accounts.find(({ address }) => address === options.fromAccount)
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
