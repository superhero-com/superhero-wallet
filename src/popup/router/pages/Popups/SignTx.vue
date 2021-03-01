<template>
  <div class="popup popup-aex2" data-cy="popup-aex2">
    <SignAccountIdenticons v-bind="transaction" />

    <SignDetailsList :transaction="transactionWithTotal">
      <AmountSend :value="transactionWithTotal.amount" slot="custom-amount" readonly />
    </SignDetailsList>

    <div class="button-fixed">
      <Button dark half @click="cancel()" data-cy="deny">
        {{ $t('pages.signTransaction.reject') }}
      </Button>
      <Button half @click="resolve()" data-cy="accept">
        {{ $t('pages.signTransaction.confirm') }}
      </Button>
    </div>
  </div>
</template>

<script>
import { OBJECT_ID_TX_TYPE } from '@aeternity/aepp-sdk/es/tx/builder/schema';
import { aettosToAe } from '../../../utils/helper';
import Button from '../../components/Button';
import AmountSend from '../../components/AmountSend';
import SignAccountIdenticons from '../../components/SignAccountIdenticons';
import SignDetailsList from '../../components/SignDetailsList';
import mixin from './mixin';

export default {
  mixins: [mixin],
  components: { Button, AmountSend, SignAccountIdenticons, SignDetailsList },
  props: {
    transaction: { type: Object, required: true },
  },
  computed: {
    transactionWithTotal() {
      const amount = +aettosToAe(this.transaction.amount);
      const fee = +aettosToAe(this.transaction.fee);
      return {
        ...this.transaction,
        amount,
        fee,
        txType: OBJECT_ID_TX_TYPE[this.transaction.tag],
        total: (amount + fee).toFixed(7),
        nameFee: this.transaction.nameFee && +aettosToAe(this.transaction.nameFee),
      };
    },
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
