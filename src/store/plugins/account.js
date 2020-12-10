import { Crypto, TxBuilder } from '@aeternity/aepp-sdk/es';
import { OBJECT_ID_TX_TYPE, TX_TYPE } from '@aeternity/aepp-sdk/es/tx/builder/schema';
import { postMessage } from '../../popup/utils/connection';
import { parseFromStorage, aettosToAe, aeToAettos } from '../../popup/utils/helper';

export default (store) =>
  store.registerModule('accounts', {
    namespaced: true,
    actions: {
      async getKeyPair({ rootGetters: { activeAccount, account } }) {
        const res = await postMessage({ type: 'getKeypair', payload: { activeAccount, account } });
        return res.error ? { error: true } : parseFromStorage(res);
      },
      async signWithoutConfirmation({ dispatch }, data) {
        const { secretKey } = await dispatch('getKeyPair');
        return Crypto.sign(data, Buffer.from(secretKey, 'hex'));
      },
      async confirmRawDataSigning({ dispatch }, data) {
        await dispatch('modals/open', { name: 'confirm-raw-sign', data }, { root: true });

        return data;
      },
      async confirmTxSigning({ dispatch }, { txBinary, opt: { modal = true } }) {
        let txObject;
        try {
          txObject = TxBuilder.unpackTx(txBinary, true).tx;
        } catch (e) {
          return dispatch('confirmRawDataSigning', txBinary);
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
          return dispatch('confirmRawDataSigning', txBinary);
        }

        const confirmProps = {
          name: 'confirm-transaction-sign',
          transaction: {
            ...txObject,
            amount: txObject.amount && +aettosToAe(txObject.amount),
            fee: +aettosToAe(txObject.fee),
            minFee: +aettosToAe(
              TxBuilder.calculateFee(0, OBJECT_ID_TX_TYPE[txObject.tag], {
                gas: txObject.gas,
                params: txObject,
              }),
            ),
            nameFee: txObject.nameFee && +aettosToAe(txObject.nameFee),
          },
        };
        const fee = modal
          ? aeToAettos(await dispatch('modals/open', confirmProps, { root: true }))
          : txObject.fee;
        return TxBuilder.buildTx(
          {
            ...txObject,
            fee,
          },
          OBJECT_ID_TX_TYPE[txObject.tag],
          { vsn: txObject.VSN },
        ).rlpEncoded;
      },
      sign({ dispatch }, data) {
        return dispatch('signWithoutConfirmation', data);
      },
      async signTransaction({ dispatch, rootState: { sdk } }, { txBase64, opt = {} }) {
        const encodedTx = await dispatch('confirmTxSigning', {
          txBinary: Crypto.decodeBase64Check(Crypto.assertedType(txBase64, 'tx')),
          opt,
        });
        const signature = await dispatch(
          'signWithoutConfirmation',
          Buffer.concat([Buffer.from(sdk.getNetworkId()), encodedTx]),
        );
        return TxBuilder.buildTx({ encodedTx, signatures: [signature] }, TX_TYPE.signed).tx;
      },
    },
  });
