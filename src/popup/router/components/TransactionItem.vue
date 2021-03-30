<template>
  <RouterLink
    class="transaction-item"
    :to="{ name: 'tx-details', params: { hash: transaction.hash } }"
  >
    <div class="left">
      <Pending v-if="transaction.pending" class="icon" />
      <TokenAmount
        :amount="getTxAmountTotal(transaction)"
        :symbol="getTxSymbol(transaction)"
        :direction="getTxDirection(transaction)"
        :altText="getTxType(transaction)"
        data-cy="amount"
      />
    </div>
    <div class="right" v-if="!transaction.pending">
      <span data-cy="date">{{ transaction.microTime | formatDate }}</span>
      <span data-cy="time">{{ transaction.microTime | formatTime }}</span>
    </div>
  </RouterLink>
</template>

<script>
import { mapGetters } from 'vuex';
import { formatDate, formatTime } from '../../utils';
import Pending from '../../../icons/animated-pending.svg?vue-component';
import TokenAmount from './TokenAmount';

export default {
  components: { TokenAmount, Pending },
  props: {
    transaction: {
      type: Object,
      required: true,
    },
  },
  filters: {
    formatDate,
    formatTime,
  },
  computed: mapGetters([
    'getTxAmountTotal',
    'getTxSymbol',
    'getTxType',
    'getTxDirection',
    'getTxTipUrl',
  ]),
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';
@import '../../../styles/typography';

.transaction-item {
  padding: 0 16px;
  border-radius: 4px;
  background: $color-bg-1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;

  &:hover {
    background: $color-hover;
  }

  .left {
    padding: 12px 0;
    display: flex;
    align-items: center;

    .icon {
      width: 24px;
      height: 24px;
      color: $color-white;
      margin-right: 2px;
    }
  }

  .right {
    @extend %face-sans-12-medium;

    > span {
      display: block;
      text-align: right;
    }

    :nth-child(1) {
      color: $color-white;
    }

    :nth-child(2) {
      color: $color-dark-grey;
    }
  }
}
</style>
