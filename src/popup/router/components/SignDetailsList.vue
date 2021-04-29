<template>
  <div class="sign-details-list">
    <DetailsItem data-cy="tx-type">
      <ae-badge>{{ txWithTotal.txType }}</ae-badge>
    </DetailsItem>

    <DetailsItem>
      <AmountInput
        v-if="txWithTotal.amount"
        :value="txWithTotal.amount"
        native-token
        readonly
      />
    </DetailsItem>

    <DetailsItem
      :label="$t('pages.signTransaction.fee')"
      data-cy="fee"
    >
      <div class="balance no-sign">
        {{ txWithTotal.fee.toFixed(7) }} {{ $t('ae') }}
      </div>
    </DetailsItem>

    <DetailsItem
      :label="$t('pages.signTransaction.total')"
      data-cy="total"
    >
      <div class="balance no-sign">
        {{ txWithTotal.total }} {{ $t('ae') }}
      </div>
    </DetailsItem>

    <template v-for="field in TX_FIELDS">
      <DetailsItem
        v-if="transaction[field]"
        :key="field"
        :label="$t('modals.confirm-transaction-sign')[field]"
        direction="column"
      >
        {{ transaction[field] }}
      </DetailsItem>
    </template>
  </div>
</template>

<script>
import { OBJECT_ID_TX_TYPE } from '@aeternity/aepp-sdk/es/tx/builder/schema';
import { aettosToAe } from '../../utils/helper';
import DetailsItem from './DetailsItemOld';
import AmountInput from './AmountInput';

export default {
  components: { DetailsItem, AmountInput },
  props: {
    transaction: { type: Object, required: true },
  },
  data: () => ({
    TX_FIELDS: [
      'payload',
      'recipientId',
      'code',
      'callData',
      'contractId',
      'commitmentId',
      'name',
      'nameFee',
      'nameSalt',
      'nameId',
      'pointers',
    ],
  }),
  computed: {
    txWithTotal() {
      const amount = this.transaction.amount && +aettosToAe(this.transaction.amount);
      const fee = +aettosToAe(this.transaction.fee);
      const nameFee = this.transaction.nameFee && +aettosToAe(this.transaction.nameFee);
      return {
        ...this.transaction,
        amount,
        fee,
        nameFee,
        total: [amount, fee, nameFee]
          .map((a) => a || 0)
          .reduce((a, b) => a + b)
          .toFixed(7),
        txType: OBJECT_ID_TX_TYPE[this.transaction.tag],
      };
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.sign-details-list {
  padding-bottom: 60px;

  li {
    list-style-type: none;
    padding: 10px;
    text-align: left;
  }

  .ae-badge {
    background: variables.$color-blue;
    color: variables.$color-white;
    -webkit-box-shadow: 0 0 0 2px variables.$color-blue;
    box-shadow: 0 0 0 2px variables.$color-blue;
    border: 2px solid variables.$color-bg-3;
  }

  .amount-input {
    width: 100%;
    margin: 0;
  }
}
</style>
