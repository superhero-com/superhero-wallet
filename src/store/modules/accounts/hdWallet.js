import {
  sign,
  unpackTx,
  Tag,
  decode,
  buildTx,
} from '@aeternity/aepp-sdk';

import { useAccounts, useAeSdk, useModals } from '@/composables';
import { usePermissions } from '@/composables/permissions';
import {
  ACCOUNT_HD_WALLET,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  PROTOCOL_AETERNITY,
} from '@/constants';
import { isTxOfASupportedType } from '@/protocols/aeternity/helpers';

export default {
  namespaced: true,

  account: {
    type: ACCOUNT_HD_WALLET,
  },

  actions: {
    signWithoutConfirmation(_, { data, options }) {
      const { activeAccount, getAccountByAddress } = useAccounts();
      const { secretKey, protocol } = (options?.fromAccount)
        ? getAccountByAddress(options.fromAccount)
        : activeAccount.value;

      if (protocol === PROTOCOL_AETERNITY) {
        return sign(data, Buffer.from(secretKey, 'hex'));
      }

      throw new Error('Unsupported protocol');
    },
    // Confirm the transaction with the modal window. Not usable from the background
    // as the background should use popups.
    // TODO replace with `checkOrAskPermission` taken from the permissions composable
    async confirmTxSigning(_, { txBase64, app }) {
      const { openModal } = useModals();
      const { checkTransactionSignLimit } = usePermissions();

      if (!isTxOfASupportedType(txBase64)) {
        await openModal(MODAL_CONFIRM_RAW_SIGN, { data: txBase64, app });
        return;
      }
      const txObject = unpackTx(txBase64);

      const hasPermission = checkTransactionSignLimit(
        app?.host || null,
        txObject, // TODO verify if this is correct
      );

      if (!hasPermission) {
        await openModal(MODAL_CONFIRM_TRANSACTION_SIGN, { tx: txObject, txBase64 });
      }
    },
    sign({ dispatch }, { data, options }) {
      return dispatch('signWithoutConfirmation', { data, options });
    },
    async signTransaction({ dispatch, rootState, rootGetters }, {
      txBase64,
      options: { modal = true, app = null, fromAccount },
    }) {
      const { nodeNetworkId } = useAeSdk({
        store: { state: rootState, getters: rootGetters },
      });
      const encodedTx = decode(txBase64, 'tx');
      if (modal) {
        await dispatch('confirmTxSigning', { txBase64, app });
      }
      const signature = await dispatch(
        'signWithoutConfirmation',
        {
          data: Buffer.concat([
            Buffer.from(nodeNetworkId.value),
            Buffer.from(encodedTx),
          ]),
          options: {
            fromAccount,
          },
        },
      );
      return buildTx({ tag: Tag.SignedTx, encodedTx, signatures: [signature] });
    },
    async signTransactionFromAccount({ dispatch, rootState, rootGetters }, {
      txBase64,
      options: { modal = true, app = null, fromAccount },
    }) {
      const { nodeNetworkId } = useAeSdk({
        store: { state: rootState, getters: rootGetters },
      });
      const encodedTx = decode(txBase64, 'tx');
      if (modal) {
        await dispatch('confirmTxSigning', { txBase64, app });
      }
      const signature = await dispatch(
        'signWithoutConfirmation',
        {
          data: Buffer.concat([
            Buffer.from(nodeNetworkId.value),
            Buffer.from(encodedTx),
          ]),
          options: { fromAccount },
        },
      );
      return buildTx({ tag: Tag.SignedTx, encodedTx, signatures: [signature] });
    },
  },
};
