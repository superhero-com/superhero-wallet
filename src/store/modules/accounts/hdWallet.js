import {
  sign,
  unpackTx,
  Tag,
  decode,
  buildTx,
} from '@aeternity/aepp-sdk';

import { useAccounts, useAeSdk, useModals } from '@/composables';
import {
  ACCOUNT_HD_WALLET,
  MODAL_CONFIRM_RAW_SIGN,
  MODAL_CONFIRM_TRANSACTION_SIGN,
  PROTOCOL_AETERNITY,
  PROTOCOLS,
} from '@/constants';
import { isTxOfASupportedType } from '@/protocols/aeternity/helpers';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

export default {
  namespaced: true,

  account: {
    type: ACCOUNT_HD_WALLET,
  },

  actions: {
    async isAccountUsed(context, address) {
      const { getAeSdk } = useAeSdk({ store: context });
      const aeSdk = await getAeSdk();
      return aeSdk.api.getAccountByPubkey(address).then(() => true, () => false);
    },
    async discover({ rootGetters: { wallet }, dispatch }) {
      const accountsToRecover = await Promise.all(
        PROTOCOLS.map(async (protocol) => (
          await ProtocolAdapterFactory.getAdapter(protocol)
        ).discoverAccounts(wallet)),
      );
      PROTOCOLS.forEach((protocol, idx) => {
        for (let i = protocol === PROTOCOL_AETERNITY ? 1 : 0; i <= accountsToRecover[idx]; i += 1) {
          dispatch('create', {
            isRestored: true,
            protocol,
          });
        }
      });
    },
    create(store, { isRestored = false, protocol = PROTOCOL_AETERNITY }) {
      const { incrementProtocolNextAccountIdx, protocolNextAccountIdx } = useAccounts({ store });

      store.commit(
        'accounts/add',
        {
          idx: protocolNextAccountIdx.value[protocol] || 0,
          type: ACCOUNT_HD_WALLET,
          isRestored,
          protocol,
        },
        { root: true },
      );
      incrementProtocolNextAccountIdx(protocol);
    },
    signWithoutConfirmation({ rootState, rootGetters }, { data, options }) {
      const { activeAccount, getAccountByAddress } = useAccounts({
        store: { state: rootState, getters: rootGetters },
      });
      const { secretKey, protocol } = (options?.fromAccount)
        ? getAccountByAddress(options.fromAccount)
        : activeAccount.value;

      if (protocol === PROTOCOL_AETERNITY) {
        return sign(data, Buffer.from(secretKey, 'hex'));
      }

      throw new Error('Unsupported protocol');
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
