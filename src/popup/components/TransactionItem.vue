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
          <span data-cy="date">{{ formatDate(transaction.microTime) }}</span>
          <span data-cy="time">{{ formatTime(transaction.microTime) }}</span>
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

<script lang="ts">
import { Tag } from '@aeternity/aepp-sdk';
import { computed, defineComponent, PropType } from '@vue/composition-api';
import {
  FUNCTION_TYPE_DEX,
  amountRounded,
  convertToken,
  formatDate,
  formatTime,
  AENS,
  DEX,
} from '../utils';
import transactionTokensMixin from '../../mixins/transactionTokensMixin';
import Pending from '../../icons/animated-pending.svg?vue-component';
import Reverted from '../../icons/refresh.svg?vue-component';
import Warning from '../../icons/warning.svg?vue-component';
import TransactionTokens from './TransactionTokenRows.vue';
import { useTransactionToken } from '../../composables';
import { ITransaction, TransactionType } from '../../types';
import { useGetter } from '../../composables/vuex';

export default defineComponent({
  components: {
    Pending,
    Reverted,
    Warning,
    TransactionTokens,
  },
  mixins: [transactionTokensMixin],
  props: {
    transaction: { type: Object as PropType<ITransaction>, required: true },
  },
  setup(props, { root }) {
    const getAmountFiat = useGetter('getAmountFiat');
    const activeNetwork = useGetter('activeNetwork');
    const account = useGetter('account');

    const {
      txType,
      getTxDirection,
      isAllowance,
      isDex,
      availableTokens,
      tokens,
      isErrorTransaction,
    } = useTransactionToken(props.transaction);

    const labels = computed(() => {
      const transactionTypes = root.$t('transaction.type') as Record<TransactionType, any>;
      const transactionType = txType.value;

      if (txType.value?.startsWith('name')) {
        return [AENS, transactionTypes[transactionType]];
      }
     if (txType === Tag.SpendTx) {
        return [root.$t('transaction.type.spendTx'), getTxDirection.value(props.transaction) === 'sent' ? root.$t('transaction.spendType.out') : root.$t('transaction.spendType.in')];
      }
      if (isAllowance.value) {
        return [root.$t('transaction.dexType.allow_token')];
      }
      if (isDex.value) {
        return [DEX, FUNCTION_TYPE_DEX.pool.includes(props.transaction.tx.function)
          ? root.$t('transaction.dexType.pool')
          : root.$t('transaction.dexType.swap')];
      }
      if ((props.transaction.tx.contractId
        && (activeNetwork.value.tipContractV1 === props.transaction.tx.contractId
          || activeNetwork.value.tipContractV2 === props.transaction.tx.contractId)
        && (props.transaction.tx.function === 'tip' || props.transaction.tx.function === 'retip')) || props.transaction.claim) {
        return [root.$t('pages.token-details.tip'), props.transaction.claim ? root.$t('transaction.spendType.in') : root.$t('transaction.spendType.out')];
      }
      if (txType === Tag.ContractCallTx
        && availableTokens.value[props.transaction.tx.contractId]
        && (props.transaction.tx.function === 'transfer' || props.transaction.incomplete)) {
        return [root.$t('transaction.type.spendTx'), props.transaction.tx.callerId === account.value.address
          ? root.$t('transaction.spendType.out') : root.$t('transaction.spendType.in')];
      }

      return props.transaction.pending ? [] : [transactionTypes[transactionType]];
    });

    const fiatAmount = computed(() => {
      // TODO add type to tokens
      const aeToken = tokens.value?.find((t: any) => t?.isAe);
      if (!aeToken || isErrorTransaction
        || (isDex.value && FUNCTION_TYPE_DEX.pool.includes(props.transaction.tx.function))
      ) return 0;
      return getAmountFiat.value(amountRounded(aeToken.decimals
        ? convertToken(aeToken.amount || 0, -aeToken.decimals) : aeToken.amount));
    });

    return {
      labels,
      fiatAmount,
      formatDate,
      formatTime,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

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
    color: variables.$color-grey-dark;
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
      color: variables.$color-grey-dark;

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
      border-bottom: 1px solid rgba(variables.$color-white, 0.15);
    }
  }

  .body {
    width: 100%;

    .footer {
      display: flex;
      justify-content: space-between;
      color: variables.$color-white;
      padding-top: 4px;

      span {
        color: variables.$color-grey-light;

        @extend %face-sans-15-medium;
      }

      .labels {
        display: flex;
        width: 100%;

        label {
          @extend %face-sans-11-regular;

          height: 22px;
          margin-right: 4px;
          padding: 2px 5px;
          border: 1px solid variables.$color-grey-dark;
          border-radius: 4px;
          color: variables.$color-grey-dark;
          font-weight: 500;
        }
      }
    }
  }
}
</style>
