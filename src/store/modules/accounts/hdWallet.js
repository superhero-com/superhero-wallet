import { Crypto, TxBuilder, SCHEMA } from '@aeternity/aepp-sdk';
import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';

const type = 'hd-wallet';

export default {
  namespaced: true,

  account: {
    type,
  },

  state: {
    nextAccountIdx: 1,
  },
  actions: {
    create({ state, commit }) {
      commit('accounts/add', { idx: state.nextAccountIdx, type }, { root: true });
      state.nextAccountIdx += 1;
    },
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
      const encodedTx = decode(txBase64, 'tx');
      if (modal) await dispatch('confirmTxSigning', encodedTx);
      const signature = await dispatch(
        'signWithoutConfirmation',
        Buffer.concat([Buffer.from(sdk.getNetworkId()), Buffer.from(encodedTx)]),
      );
      return TxBuilder.buildTx({ encodedTx, signatures: [signature] }, SCHEMA.TX_TYPE.signed).tx;
    },
  },
};
