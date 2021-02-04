<template>
  <div class="popup popup-aex2" data-cy="popup-aex2">
    <SignAccountIdenticons :transaction="transaction" />

    <SignDetailsList :transaction="transaction">
      <AmountSend v-model="tx.amount" slot="custom-amount" />
    </SignDetailsList>

    <div class="button-fixed">
      <Button dark half @click="cancel" :disabled="!props.reject" data-cy="deny">
        {{ $t('pages.signTransaction.reject') }}
      </Button>
      <Button
        half
        @click="sign"
        :disabled="Number.isNaN(+tx.amount) || tx.amount < 0 || !props.resolve"
        data-cy="accept"
      >
        {{ $t('pages.signTransaction.confirm') }}
      </Button>
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script>
import { OBJECT_ID_TX_TYPE } from '@aeternity/aepp-sdk/es/tx/builder/schema';
import { TxBuilder } from '@aeternity/aepp-sdk/es';
import { aettosToAe, aeToAettos } from '../../../utils/helper';
import Button from '../../components/Button';
import AmountSend from '../../components/AmountSend';
import getPopupProps from '../../../utils/getPopupProps';
import SignAccountIdenticons from '../../components/SignAccountIdenticons';
import SignDetailsList from '../../components/SignDetailsList';

export default {
  components: { Button, AmountSend, SignAccountIdenticons, SignDetailsList },
  data() {
    return {
      props: {},
      loading: false,
      unpackedTx: null,
      tx: {
        amount: 0,
      },
    };
  },
  async created() {
    this.props = await getPopupProps();
    this.unpackedTx = TxBuilder.unpackTx(this.props.action.params.tx);
    if (this.txObject.amount >= 0) this.tx.amount = +aettosToAe(this.txObject.amount);
  },
  computed: {
    txObject() {
      return this.unpackedTx ? this.unpackedTx.tx : {};
    },
    totalSpend() {
      const amount = this.tx.amount || 0;
      return (parseFloat(amount) + parseFloat(+aettosToAe(this.txObject.fee || 0))).toFixed(7);
    },
    transaction() {
      return {
        ...this.txObject,
        fee: +aettosToAe(this.txObject.fee || 0),
        txType: OBJECT_ID_TX_TYPE[this.txObject.tag],
        total: this.totalSpend,
        nameFee: this.txObject.nameFee && +aettosToAe(this.txObject.nameFee),
      };
    },
  },
  methods: {
    cancel() {
      this.props.reject(false);
    },
    async sign() {
      const { tx } = TxBuilder.buildTx(
        {
          ...this.unpackedTx.tx,
          ...this.tx,
          amount: +aeToAettos(this.tx.amount || 0),
        },
        OBJECT_ID_TX_TYPE[this.txObject.tag],
      );
      if (parseFloat(this.tx.amount) !== +aettosToAe(this.unpackedTx.tx.amount || 0)) {
        this.loading = true;
        this.props.resolve(tx);
      } else {
        this.props.resolve();
      }
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
