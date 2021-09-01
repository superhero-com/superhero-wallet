/* eslint no-param-reassign: ["error", { "ignorePropertyModificationsFor": ["state"] }] */

import TransportU2F from '@ledgerhq/hw-transport-u2f';
import Ae from '@aeternity/ledger-app-api';
import { Crypto } from '@aeternity/aepp-sdk';

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
    ledgerAppApi: () => new Ae(new TransportU2F()),
  },

  actions: {
    async request({ getters: { ledgerAppApi }, dispatch }, { name, args }) {
      if (process.env.RUNNING_IN_FRAME) return ledgerAppApi[name](...args);
      let result;
      let error;
      do {
        if (error) {
          // eslint-disable-next-line no-await-in-loop
          await dispatch('modals/open', { name: 'confirm', title: 'Try again' }, { root: true });
        }
        try {
          result = await ledgerAppApi[name](...args); // eslint-disable-line no-await-in-loop
          error = false;
        } catch (err) {
          error = true;
        }
      } while (error);
      return result;
    },

    async create({ getters: { nextIdx, ledgerAppApi }, commit, dispatch }) {
      try {
        const address = await ledgerAppApi.getAddress(nextIdx, true);
        commit('accounts/add', {
          address, type: 'ledger', idx: nextIdx, color: '#000', shift: 0,
        }, { root: true });
      } catch (error) {
        dispatch('modals/open', { name: 'default', icon: 'alert', title: 'address not confirmed' }, { root: true });
      }
    },

    async ensureCurrentAccountAvailable({ rootGetters: { account }, dispatch }) {
      const address = await dispatch('request', { name: 'getAddress', args: [account.idx] });
      if (account.address !== address) {
        if (!process.env.RUNNING_IN_FRAME) {
          dispatch('modals/open', { name: 'dafault', icon: 'alert', title: 'account not found' }, { root: true });
        }
        throw new Error('Account not found');
      }
    },

    sign: () => Promise.reject(new Error('Not implemented yet')),

    async signTransaction({ rootGetters: { account }, dispatch, rootState }, { txBase64 }) {
      await dispatch('ensureCurrentAccountAvailable');

      const binaryTx = Crypto.decodeBase64Check(Crypto.assertedType(txBase64, 'tx'));
      const signature = Buffer.from(await dispatch('request', {
        name: 'signTransaction',
        args: [
          account.idx,
          binaryTx,
          rootState.sdk.getNetworkId(),
        ],
      }), 'hex');
      return Crypto.encodeTx(Crypto.prepareTx(signature, binaryTx));
    },
  },
};
