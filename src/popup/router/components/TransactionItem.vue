<template>
  <div class="transaction-item">
    <div class="left">
      <Pending v-if="transaction.pending" class="icon" />
      <TokenAmount
        :amount="amount"
        :symbol="symbol"
        :direction="direction"
        :altText="txType"
        data-cy="amount"
      />
    </div>
    <div class="right" v-if="!transaction.pending">
      <span data-cy="date">{{ transaction.microTime | formatDate }}</span>
      <span data-cy="time">{{ transaction.microTime | formatTime }}</span>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { aettosToAe, categorizeContractCallTxObject, convertToken } from '../../utils/helper';
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
  computed: {
    ...mapGetters(['account', 'activeNetwork']),
    ...mapState('fungibleTokens', ['availableTokens']),
    direction() {
      return ['senderId', 'accountId', 'ownerId', 'callerId']
        .map((key) => this.transaction.tx[key])
        .includes(this.account.address)
        ? 'sent'
        : 'received';
    },
    amount() {
      if (this.contractCallData) {
        return +convertToken(
          this.contractCallData.amount,
          -this.availableTokens[this.contractCallData.token].decimals,
        );
      }
      const amount = this.transaction.tx.amount || this.transaction.tx.name_fee || 0;
      const fee = this.transaction.tx.fee || 0;
      return +aettosToAe(+amount + fee);
    },
    symbol() {
      return this.contractCallData
        ? this.availableTokens[this.contractCallData.token].symbol
        : 'AE';
    },
    txType() {
      return this.symbol === 'AE' ? this.transaction.tx.type : null;
    },
    contractCallData() {
      return categorizeContractCallTxObject(this.transaction);
    },
  },
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
  cursor: pointer;

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
      fill: $color-white;
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
