import { Crypto, TxBuilder } from '@aeternity/aepp-sdk/es';
import { OBJECT_ID_TX_TYPE, TX_TYPE } from '@aeternity/aepp-sdk/es/tx/builder/schema';

export default (store) => store.registerModule('accounts', {
  namespaced: true,
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
        TX_TYPE.spend,
        TX_TYPE.contractCreate,
        TX_TYPE.contractCall,
        TX_TYPE.namePreClaim,
        TX_TYPE.nameClaim,
        TX_TYPE.nameUpdate,
        TX_TYPE.nameTransfer,
      ];
      if (!SUPPORTED_TX_TYPES.includes(OBJECT_ID_TX_TYPE[txObject.tag])) {
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
      return TxBuilder.buildTx({ encodedTx, signatures: [signature] }, TX_TYPE.signed).tx;
    },
  },
});
