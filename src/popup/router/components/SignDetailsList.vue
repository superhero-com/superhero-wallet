<template>
  <div class="sign-details-list">
    <DetailsItem data-cy="tx-type">
      <ae-badge>{{ transaction.txType }}</ae-badge>
    </DetailsItem>

    <DetailsItem v-if="$slots['custom-amount']">
      <slot name="custom-amount" />
    </DetailsItem>

    <DetailsItem :label="$t('pages.signTransaction.fee')" data-cy="fee">
      <div class="balance no-sign">{{ parseFloat(transaction.fee).toFixed(7) }} {{ $t('ae') }}</div>
    </DetailsItem>

    <DetailsItem :label="$t('pages.signTransaction.total')" data-cy="total">
      <div class="balance no-sign">{{ transaction.total }} {{ $t('ae') }}</div>
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
import DetailsItem from './DetailsItem';

export default {
  components: { DetailsItem },
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
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.sign-details-list {
  padding-bottom: 60px;

  li {
    list-style-type: none;
    padding: 10px;
    text-align: left;
  }

  .ae-badge {
    background: $secondary-color;
    color: $white-color;
    -webkit-box-shadow: 0 0 0 2px $secondary-color;
    box-shadow: 0 0 0 2px $secondary-color;
    border: 2px solid $bg-color;
  }
}
</style>
