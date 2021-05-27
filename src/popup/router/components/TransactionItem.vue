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
        :direction="getTxDirection(transaction)"
        :alt-text="getTxType(transaction)"
        data-cy="amount"
      />
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
@use '../../../styles/variables';
@use '../../../styles/typography';

.transaction-item {
  padding: 0 16px;
  margin: 1px 16px;
  border-radius: 12px;
  background: variables.$color-white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;

  &:hover {
    border: 2px solid variables.$color-blue;
    box-sizing: border-box;
    border-radius: 12px;
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
  }

  .right {
    @extend %face-sans-12-medium;

    > span {
      display: block;
      text-align: right;
    }

    :nth-child(1) {
      color: variables.$color-white;
    }

    :nth-child(2) {
      color: variables.$color-dark-grey;
    }
  }
}
</style>
