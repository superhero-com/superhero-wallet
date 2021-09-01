import Vue from 'vue';
import { Crypto, TxBuilder, SCHEMA } from '@aeternity/aepp-sdk';

export default {
  namespaced: true,
  state: {
    accs: [{
      idx: 0, color: '#1161FE', shift: 0, showed: true,
    }],
    accountSelectedIdx: 0,
    accountCount: 1,
  },
  mutations: {
    createAccount(state) {
      state.accs.push({
        idx: state.accountCount,
        color:
          // eslint-disable-next-line no-bitwise
          state.accountCount === 1 ? '#00FF9D' : `#${((Math.random() * 0xffffff) << 0).toString(16)}`,
        shift: Math.floor(Math.random() * 100),
        showed: state.accs.reduce((a, b) => (b.showed ? a + 1 : a), 0) < 8,
      });
      state.accountCount += 1;
    },
    deleteAccount(state, idx) {
      if (state.accountSelectedIdx === idx) state.accountSelectedIdx = 0;
      Vue.delete(state.accs, idx);
    },
    selectAccount(state, idx) {
      state.accountSelectedIdx = idx;
    },
    setAccountLocalName(state, { name, idx }) {
      Vue.set(state.accs[idx], 'localName', name);
    },
    toggleAccountShowed(state, idx) {
      if (state.accountSelectedIdx === idx) state.accountSelectedIdx = 0;
      Vue.set(state.accs[idx], 'showed', !state.accs[idx].showed);
    },
  },
  actions: {
    signWithoutConfirmation({ rootGetters: { account } }, data) {
      return Crypto.sign(data, account.secretKey);
    },
    async confirmRawDataSigning({ dispatch }, data) {
      await dispatch('modals/open', { name: 'confirm-raw-sign', data }, { root: true });
    },
    async confirmTxSigning({ dispatch }, encodedTx) {
      let txObject;
      try {
        txObject = TxBuilder.unpackTx(encodedTx, true).tx;
      } catch (e) {
        await dispatch('confirmRawDataSigning', encodedTx);
        return;
      }
      const SUPPORTED_TX_TYPES = [
        SCHEMA.TX_TYPE.spend,
        SCHEMA.TX_TYPE.contractCreate,
        SCHEMA.TX_TYPE.contractCall,
        SCHEMA.TX_TYPE.namePreClaim,
        SCHEMA.TX_TYPE.nameClaim,
        SCHEMA.TX_TYPE.nameUpdate,
        SCHEMA.TX_TYPE.nameTransfer,
      ];
      if (!SUPPORTED_TX_TYPES.includes(SCHEMA.OBJECT_ID_TX_TYPE[txObject.tag])) {
        await dispatch('confirmRawDataSigning', encodedTx);
        return;
      }

      await dispatch(
        'modals/open',
        { name: 'confirm-transaction-sign', transaction: txObject },
        { root: true },
      );
    },
    sign({ dispatch }, data) {
      return dispatch('signWithoutConfirmation', data);
    },
    async signTransaction({ dispatch, rootState: { sdk } }, { txBase64, opt: { modal = true } }) {
      const encodedTx = Crypto.decodeBase64Check(Crypto.assertedType(txBase64, 'tx'));
      if (modal) await dispatch('confirmTxSigning', encodedTx);
      const signature = await dispatch(
        'signWithoutConfirmation',
        Buffer.concat([Buffer.from(sdk.getNetworkId()), encodedTx]),
      );
      return TxBuilder.buildTx({ encodedTx, signatures: [signature] }, SCHEMA.TX_TYPE.signed).tx;
    },
  },
};
