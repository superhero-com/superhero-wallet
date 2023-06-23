/* eslint no-param-reassign: ["error", { "ignorePropertyModificationsFor": ["state"] }] */

import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import Ae from '@aeternity/ledger-app-api';
import { TxBuilder, SCHEMA } from '@aeternity/aepp-sdk';
import { ACCOUNT_LEDGER_WALLET, MODAL_CONFIRM } from '../../../popup/utils';
import { useModals } from '../../../composables';

export default {
  namespaced: true,

  account: {
    type: ACCOUNT_LEDGER_WALLET,
  },

  getters: {
    nextIdx: (state, getters, rootState, rootGetters) => Math.max(
      ...rootGetters['accounts/getByType']('ledger').map(({ idx }) => idx),
      -1,
    ) + 1,
  },

  actions: {
    async request(_, { name, args }) {
      let result;
      let error;
      const transport = await TransportWebUSB.create();
      const ledgerAppApi = new Ae(transport);
      const { openModal } = useModals();
      try {
        do {
          if (error) {
            // eslint-disable-next-line no-await-in-loop
            await openModal(MODAL_CONFIRM, { title: 'Try again' });
          }
          try {
            // eslint-disable-next-line no-await-in-loop
            result = await ledgerAppApi[name](...args);
            error = false;
          } catch (err) {
            error = true;
          }
        } while (error);
      } finally {
        await transport.close();
      }
      return result;
    },

    async create({ getters: { nextIdx }, commit, dispatch }) {
      const { openDefaultModal } = useModals();
      let address;
      try {
        address = await dispatch('request', { name: 'getAddress', args: [nextIdx, true] });
        commit('accounts/add', { address, type: ACCOUNT_LEDGER_WALLET, idx: nextIdx }, { root: true });
      } catch (error) {
        openDefaultModal({ icon: 'alert', title: 'address not confirmed' });
      }
    },

    async ensureCurrentAccountAvailable({ rootGetters: { account }, dispatch }) {
      const { openDefaultModal } = useModals();
      const address = await dispatch('request', { name: 'getAddress', args: [account.idx] });
      if (account.address !== address) {
        if (!process.env.IS_EXTENSION) {
          openDefaultModal({ icon: 'alert', title: 'account not found' });
        }
        throw new Error('Account not found');
      }
    },

    sign: () => Promise.reject(new Error('Not implemented yet')),

    async signTransaction({ rootGetters: { account, 'sdkPlugin/sdk': sdk }, dispatch }, { txBase64 }) {
      await dispatch('ensureCurrentAccountAvailable');

      const txObject = TxBuilder.unpackTx(txBase64).tx;
      const binaryTx = TxBuilder.buildTx(
        txObject,
        SCHEMA.OBJECT_ID_TX_TYPE[txObject.tag],
        { vsn: txObject.VSN },
      ).rlpEncoded;

      const signature = Buffer.from(await dispatch('request', {
        name: 'signTransaction',
        args: [
          account.idx,
          binaryTx,
          sdk.getNetworkId(),
        ],
      }), 'hex');

      return TxBuilder
        .buildTx({ encodedTx: binaryTx, signatures: [signature] }, SCHEMA.TX_TYPE.signed).tx;
    },

    async signTransactionFromAccount({ dispatch }, { txBase64 }) {
      return dispatch('signTransaction', { txBase64 });
    },
  },
};
