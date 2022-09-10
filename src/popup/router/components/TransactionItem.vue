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
      <TransactionTokens
        :tokens="tokens"
        :error="isErrorTransaction"
      />
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
import { mapGetters } from 'vuex';
import { SCHEMA } from '@aeternity/aepp-sdk';
import { FUNCTION_TYPE_DEX } from '../../utils/constants';
import { amountRounded, convertToken } from '../../utils/helper';
import { formatDate, formatTime } from '../../utils';
import transactionTokensMixin from '../../../mixins/transactionTokensMixin';
import Pending from '../../../icons/animated-pending.svg?vue-component';
import Reverted from '../../../icons/refresh.svg?vue-component';
import Warning from '../../../icons/warning.svg?vue-component';
import TransactionTokens from './TransactionTokenRows.vue';

export default {
  components: {
    Pending,
    Reverted,
    Warning,
    TransactionTokens,
  },
  filters: {
    formatDate,
    formatTime,
  },
  mixins: [transactionTokensMixin],
  props: {
    transaction: { type: Object, required: true },
  },
  computed: {
    ...mapGetters(['account', 'getAmountFiat', 'activeNetwork']),
    labels() {
      if (this.txType && this.txType?.startsWith('name')) {
        return ['AENS', this.$t('transaction.type')[this.txType]];
      }
      if (this.txType === SCHEMA.TX_TYPE.spend) {
        return [this.$t('transaction.type.spendTx'), this.getTxDirection(this.transaction) === 'sent' ? this.$t('transaction.spendType.out') : this.$t('transaction.spendType.in')];
      }
      if (this.isAllowance) {
        return [this.$t('transaction.dexType.allow_token')];
      }
      if (this.isDex) {
        return ['DEX', FUNCTION_TYPE_DEX.pool.includes(this.transaction.tx.function)
          ? this.$t('transaction.dexType.pool')
          : this.$t('transaction.dexType.swap')];
      }
      if ((this.transaction.tx.contractId
        && (this.activeNetwork.tipContractV1 === this.transaction.tx.contractId
        || this.activeNetwork.tipContractV2 === this.transaction.tx.contractId)
        && (this.transaction.tx.function === 'tip' || this.transaction.tx.function === 'retip')) || this.transaction.claim) {
        return [this.$t('pages.token-details.tip'), this.transaction.claim ? this.$t('transaction.spendType.in') : this.$t('transaction.spendType.out')];
      }
      if (this.txType === SCHEMA.TX_TYPE.contractCall
        && this.availableTokens[this.transaction.tx.contractId]
        && (this.transaction.tx.function === 'transfer' || this.transaction.incomplete)) {
        return [this.$t('transaction.type.spendTx'), this.transaction.tx.callerId === this.account.address
          ? this.$t('transaction.spendType.out') : this.$t('transaction.spendType.in')];
      }
      return this.transaction.pending ? [] : [this.$t('transaction.type')[this.txType]];
    },
    fiatAmount() {
      const aeToken = this.tokens?.find((t) => t?.isAe);
      if (!aeToken || this.isErrorTransaction
        || (this.isDex && FUNCTION_TYPE_DEX.pool.includes(this.transaction.tx.function))) return 0;
      return this.getAmountFiat(amountRounded(aeToken.decimals
        ? convertToken(aeToken.amount || 0, -aeToken.decimals) : aeToken.amount));
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.transaction-item {
  padding: 4px var(--screen-padding-x) 10px;
  margin-left: calc(-1 * var(--screen-padding-x));
  margin-right: calc(-1 * var(--screen-padding-x));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;

  &:hover {
    background-color: variables.$color-bg-4-hover;
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
