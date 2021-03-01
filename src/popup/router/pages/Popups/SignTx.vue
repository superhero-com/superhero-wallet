<template>
  <div class="popup popup-aex2" data-cy="popup-aex2">
    <SignAccountIdenticons v-bind="transaction" />

    <SignDetailsList :transaction="transaction">
      <AmountSend :value="transaction && transaction.amount" slot="custom-amount" readonly />
    </SignDetailsList>

    <div class="button-fixed">
      <Button dark half @click="() => reject()" data-cy="deny">
        {{ $t('pages.signTransaction.reject') }}
      </Button>
      <Button half @click="() => resolve()" data-cy="accept">
        {{ $t('pages.signTransaction.confirm') }}
      </Button>
    </div>
  </div>
</template>

<script>
import { OBJECT_ID_TX_TYPE } from '@aeternity/aepp-sdk/es/tx/builder/schema';
import { TxBuilder } from '@aeternity/aepp-sdk/es';
import { aettosToAe } from '../../../utils/helper';
import Button from '../../components/Button';
import AmountSend from '../../components/AmountSend';
import getPopupProps from '../../../utils/getPopupProps';
import SignAccountIdenticons from '../../components/SignAccountIdenticons';
import SignDetailsList from '../../components/SignDetailsList';

export default {
  components: { Button, AmountSend, SignAccountIdenticons, SignDetailsList },
  data() {
    return {
      resolve: null,
      reject: null,
      transaction: null,
    };
  },
  async mounted() {
    const { action, resolve, reject } = await getPopupProps();
    Object.assign(this, { resolve, reject });
    const unpackedTx = TxBuilder.unpackTx(action.params.tx).tx;
    const amount = +aettosToAe(unpackedTx.amount);
    const fee = +aettosToAe(unpackedTx.fee);
    this.transaction = {
      ...unpackedTx,
      amount,
      fee,
      txType: OBJECT_ID_TX_TYPE[unpackedTx.tag],
      total: (amount + fee).toFixed(7),
      nameFee: unpackedTx.nameFee && +aettosToAe(unpackedTx.nameFee),
    };
  },
};
</script>

<style lang="scss" scoped>
.amount-send-container {
  width: 100%;
  margin: 0;
}

.popup {
  padding: 0;
}
</style>
