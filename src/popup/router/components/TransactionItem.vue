<template>
  <RouterLink
    class="transaction-item"
    :to="{ name: 'tx-details', params: { hash: transaction.hash } }"
  >
    <div class="header">
      <span />
      <div class="status">
        <template v-if="transaction.pending">
          <Pending class="icon" />
          <span class="pending">{{ $t('transaction.type.pending') }}</span>
        </template>
        <template v-else>
          <span data-cy="date">{{ transaction.microTime | formatDate }}</span>
          <span data-cy="time">{{ transaction.microTime | formatTime }}</span>
          <div
            v-if="isErrorTransaction"
            class="error"
          >
            <Warning
              v-if="transaction.tx.returnType === 'abort'"
              class="icon"
            />
            <Reverted
              v-else
              class="icon"
            />
            <span>{{ $t('transaction.returnType')[transaction.tx.returnType] }}</span>
          </div>
        </template>
      </div>
      <span />
    </div>
    <div class="body">
      <div
        v-for="token in tokens.filter(({ amount }) => amount != null)"
        :key="token.symbol"
        :class="['token-row', token.isReceived ? 'received': 'sent', { error: isErrorTransaction }]"
      >
        <Tokens :tokens="token.isPool ? [tokens[0], tokens[1]] : [token]" />
        <span class="amount">
          {{
            `${token.isReceived ? '+' : '-'}
            ${amountRounded(token.decimals
            ? convertToken(token.amount || 0, -token.decimals) : token.amount)}`
          }}
        </span>
      </div>
      <div class="footer">
        <div class="labels">
          <label
            v-for="label in labels"
            :key="label"
          >
            {{ label.toUpperCase() }}
          </label>
        </div>
        <span v-if="fiatAmount">{{ fiatAmount }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { SCHEMA } from '@aeternity/aepp-sdk';
import { camelCase } from 'lodash-es';
import BigNumber from 'bignumber.js';
import { FUNCTION_TYPE_DEX, MAGNITUDE } from '../../utils/constants';
import { convertToken } from '../../utils/helper';
import { formatDate, formatTime } from '../../utils';
import * as TransactionResolver from '../../utils/transactionTokenInfoResolvers';
import Pending from '../../../icons/animated-pending.svg?vue-component';
import Reverted from '../../../icons/refresh.svg?vue-component';
import Warning from '../../../icons/warning.svg?vue-component';
import Tokens from './Tokens.vue';

export default {
  components: {
    Pending, Reverted, Warning, Tokens,
  },
  filters: {
    formatDate,
    formatTime,
  },
  props: {
    transaction: { type: Object, required: true },
  },
  computed: {
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapGetters([
      'getTxAmountTotal',
      'getTxSymbol',
      'getTxType',
      'getTxDirection',
      'account',
      'getDexContracts',
      'getAmountFiat',
    ]),
    txType() {
      return this.getTxType(this.transaction);
    },
    tokens() {
      const resolver = TransactionResolver[camelCase(this.transaction?.tx?.function)];
      if (resolver && !this.isAllowanceTransaction) {
        return resolver(this.transaction, this.availableTokens).tokens;
      }
      return [{
        ...this.transaction.tx,
        amount: this.isAllowanceTransaction
          ? convertToken(this.transaction.tx.fee, -MAGNITUDE)
          : this.getTxAmountTotal(this.transaction),
        symbol: this.isAllowanceTransaction ? 'AE' : this.getTxSymbol(this.transaction),
        isReceived: this.getTxDirection(this.transaction) === 'received',
        isAe: this.isAllowanceTransaction || this.getTxSymbol(this.transaction) === 'AE',
      }];
    },
    labels() {
      if (this.txType && this.txType?.startsWith('name')) {
        return ['AENS', this.$t('transaction.type')[this.txType]];
      }
      if (this.txType === SCHEMA.TX_TYPE.spend) {
        return ['SPEND', this.getTxDirection(this.transaction) === 'sent' ? 'OUT' : 'IN'];
      }
      if (this.isAllowanceTransaction) {
        return ['TOKEN', 'ALLOWANCE'];
      }
      if (TransactionResolver[camelCase(this.transaction.tx.function)]
        && (this.getDexContracts.wae.includes(this.transaction.tx.contractId)
        || this.getDexContracts.router.includes(this.transaction.tx.contractId))) {
        return ['DEX', FUNCTION_TYPE_DEX.pool.includes(this.transaction.tx.function) ? 'POOL' : 'SWAP'];
      }
      if (this.txType === (SCHEMA.TX_TYPE.contractCall)
        && this.availableTokens[this.transaction.tx.contractId]
        && (this.transaction.tx.function === 'transfer' || this.transaction.incomplete)) {
        return ['SPEND', this.transaction.tx.callerId === this.account.address ? 'OUT' : 'IN'];
      }
      return this.transaction.pending ? [] : [this.$t('transaction.type')[this.txType]];
    },
    isErrorTransaction() {
      return this.transaction?.tx?.returnType && this.transaction.tx.returnType !== 'ok';
    },
    isAllowanceTransaction() {
      return FUNCTION_TYPE_DEX.allowance.includes(this.transaction.tx?.function)
        && this.availableTokens[this.transaction.tx?.contractId];
    },
    fiatAmount() {
      const aeToken = this.tokens?.find((t) => t?.isAe);
      if (!aeToken || this.isErrorTransaction) return 0;
      return this.getAmountFiat(this.amountRounded(aeToken.decimals
        ? convertToken(aeToken.amount || 0, -aeToken.decimals) : aeToken.amount));
    },
  },
  methods: {
    convertToken,
    amountRounded(rawAmount) {
      let amount = rawAmount;
      if (typeof rawAmount !== 'object') {
        amount = new BigNumber(rawAmount);
      }

      if (amount < 0.01 && amount.toString().length < 9 + 2) {
        return amount.toFixed();
      }
      return amount.toFixed((amount < 0.01) ? 9 : 2);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.transaction-item {
  padding: 4px 8px 10px 8px;
  background: variables.$color-bg-1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;

  &:hover {
    background: variables.$color-hover;
  }

  .header {
    display: flex;
    align-items: center;
    width: 100%;
    color: variables.$color-dark-grey;
    margin-bottom: 4px;

    .icon {
      width: 16px;
      height: 16px;
      color: variables.$color-white;
      margin-right: 2px;
    }

    .status {
      display: flex;
      margin-left: 8px;
      white-space: nowrap;
      color: variables.$color-dark-grey;

      @extend %face-sans-12-regular;

      span {
        margin-right: 8px;
      }

      .error {
        display: flex;
        color: variables.$color-warning;

        .icon {
          color: variables.$color-warning;
        }
      }

      .pending {
        font-weight: 500;
      }
    }

    > span {
      width: 100%;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    }
  }

  .body {
    width: 100%;

    .token-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;

      @extend %face-sans-15-medium;

      &.error .amount {
        color: variables.$color-dark-grey;
      }

      &.received:not(.error) .amount {
        color: variables.$color-green-hover;
      }

      &.sent:not(.error) .amount {
        color: variables.$color-error;
      }

      .tokens {
        @extend %face-sans-15-medium;
      }
    }

    .footer {
      display: flex;
      justify-content: space-between;
      color: white;
      padding-top: 4px;

      span {
        color: variables.$color-light-grey;

        @extend %face-sans-15-medium;
      }

      .labels {
        display: flex;
        width: 100%;

        label {
          height: 22px;
          margin-right: 4px;
          padding: 2px 5px;
          border: 1px solid variables.$color-dark-grey;
          border-radius: 4px;
          color: variables.$color-dark-grey;

          @extend %face-sans-11-regular;

          font-weight: 500;
        }
      }
    }
  }
}
</style>
