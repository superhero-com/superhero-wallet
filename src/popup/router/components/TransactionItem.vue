<template>
  <RouterLink
    class="transaction-item"
    :to="{ name: 'tx-details', params: { hash: transaction.hash } }"
  >
    <div class="left">
      <Pending
        v-if="transaction.pending"
        class="icon"
      />
      <TokenAmount
        :amount="getTxAmountTotal(transaction)"
        :symbol="getTxSymbol(transaction)"
        :aex9="isTxAex9(transaction)"
        :direction="getTxDirection(transaction)"
        :hide-fiat="showType"
        data-cy="amount"
      />
      <span
        v-if="showType"
        class="type"
      >
        ({{ $t('transaction.type')[txType] || txType }})
      </span>
    </div>
    <div
      v-if="!transaction.pending"
      class="right"
    >
      <span data-cy="date">{{ transaction.microTime | formatDate }}</span>
      <span data-cy="time">{{ transaction.microTime | formatTime }}</span>
    </div>
  </RouterLink>
</template>

<script>
import { mapGetters } from 'vuex';
import { SCHEMA } from '@aeternity/aepp-sdk';
import { formatDate, formatTime } from '../../utils';
import Pending from '../../../icons/animated-pending.svg?vue-component';
import TokenAmount from './TokenAmount';

export default {
  components: { TokenAmount, Pending },
  filters: {
    formatDate,
    formatTime,
  },
  props: {
    transaction: { type: Object, required: true },
  },
  computed: {
    ...mapGetters([
      'getTxAmountTotal',
      'getTxSymbol',
      'getTxType',
      'getTxDirection',
      'getTxTipUrl',
      'isTxAex9',
    ]),
    txType() {
      return this.getTxType(this.transaction);
    },
    showType() {
      return !this.isTxAex9(this.transaction) && this.txType
        && this.txType !== SCHEMA.TX_TYPE.spend;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.transaction-item {
  padding: 0 16px;
  margin: 1px 0;
  border-radius: 4px;
  background: variables.$color-bg-1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;

  &:hover {
    background: variables.$color-hover;
  }

  .left {
    padding: 12px 0;
    display: flex;
    align-items: center;

    .icon {
      width: 24px;
      height: 24px;
      color: variables.$color-white;
      margin-right: 2px;
    }

    .type {
      @extend %face-sans-14-regular;

      color: variables.$color-dark-grey;
      margin-left: 2px;
    }
  }

  .right {
    @extend %face-sans-12-medium;

    > span {
      display: block;
      text-align: right;
    }

    :nth-child(1) {
      color: variables.$color-light-grey;
    }

    :nth-child(2) {
      color: variables.$color-dark-grey;
    }
  }
}
</style>
