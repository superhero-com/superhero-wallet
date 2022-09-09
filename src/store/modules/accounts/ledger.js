/* eslint no-param-reassign: ["error", { "ignorePropertyModificationsFor": ["state"] }] */

import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import Ae from '@aeternity/ledger-app-api';
import { TxBuilder, SCHEMA } from '@aeternity/aepp-sdk';

export default {
  namespaced: true,

  account: {
    type: 'ledger',
  },

  getters: {
    nextIdx: (state, getters, rootState, rootGetters) => Math.max(
      ...rootGetters['accounts/getByType']('ledger').map(({ idx }) => idx),
      -1,
    ) + 1,
  },

  actions: {
    async request({ dispatch }, { name, args }) {
      let result;
      let error;
      const transport = await TransportWebUSB.create();
      const ledgerAppApi = new Ae(transport);
      try {
        do {
          if (error) {
            // eslint-disable-next-line no-await-in-loop
            await dispatch('modals/open', { name: 'confirm', title: 'Try again' }, { root: true });
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
      let address;
      try {
        address = await dispatch('request', { name: 'getAddress', args: [nextIdx, true] });
        commit('accounts/add', { address, type: 'ledger', idx: nextIdx }, { root: true });
      } catch (error) {
        dispatch('modals/open', { name: 'default', icon: 'alert', title: 'address not confirmed' }, { root: true });
      }
    },

    async ensureCurrentAccountAvailable({ rootGetters: { account }, dispatch }) {
      const address = await dispatch('request', { name: 'getAddress', args: [account.idx] });
      if (account.address !== address) {
        if (!process.env.IS_EXTENSION) {
          dispatch('modals/open', { name: 'dafault', icon: 'alert', title: 'account not found' }, { root: true });
        }
        throw new Error('Account not found');
      }
    },

    sign: () => Promise.reject(new Error('Not implemented yet')),

    async signTransaction({ rootGetters: { account }, dispatch, rootState }, { txBase64 }) {
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
          rootState.sdk.getNetworkId(),
        ],
      }), 'hex');
      return TxBuilder
        .buildTx({ encodedTx: binaryTx, signatures: [signature] }, SCHEMA.TX_TYPE.signed).tx;
    },
  },
};
