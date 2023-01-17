<template>
  <RouterLink
    class="transaction-item"
    :to="{ name: 'tx-details', params: { hash: transaction.hash } }"
  >
    <TransactionTokens
      :tokens="tokens"
      :error="isErrorTransaction"
    />
    {{ isDex }}
    <div class="footer">
      <TransactionItemType
        :transaction="transaction"
        :transaction-date="transactionDate"
      />
      <span v-if="fiatAmount && !transaction.transactionOwner">{{ fiatAmount }}</span>
      <span v-else-if="transaction.transactionOwner">{{ transactionDate }}</span>
    </div>
  </RouterLink>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api';
import dayjs from 'dayjs';
import {
  FUNCTION_TYPE_DEX,
  amountRounded,
  convertToken,
  formatDate,
  formatTime,
  relativeTimeTo,
} from '../utils';
import TransactionTokens from './TransactionTokenRows.vue';
import { useTransactionToken } from '../../composables';
import { useGetter } from '../../composables/vuex';
import { IDashboardTransaction, ITransaction } from '../../types';
import TransactionItemType from './TransactionItemType.vue';

export default defineComponent({
  components: {
    TransactionItemType,
    TransactionTokens,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction | IDashboardTransaction>, required: true },
  },
  setup(props, { root }) {
    const getAmountFiat = useGetter('getAmountFiat');

    const {
      isDex,
      tokens,
      isErrorTransaction,
    } = useTransactionToken({
      store: root.$store,
      initTransaction: props.transaction,
    });

    const transactionDate = computed(
      () => relativeTimeTo(dayjs(props.transaction.microTime).toISOString()),
    );

    const fiatAmount = computed(() => {
      // TODO add type to tokens
      const aeToken = tokens.value?.find((t: any) => t?.isAe);
      return (
        !aeToken
          || isErrorTransaction.value
          || (isDex.value && FUNCTION_TYPE_DEX.pool.includes(props.transaction.tx.function))
      )
        ? 0
        : getAmountFiat.value(amountRounded(
          aeToken.decimals
            ? convertToken(aeToken.amount || 0, -aeToken.decimals)
            : aeToken.amount,
        ));
    });

    return {
      fiatAmount,
      transactionDate,
      isErrorTransaction,
      tokens,
      isDex,
      formatDate,
      formatTime,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.transaction-item {
  @include mixins.flex(center, center, column);

  padding: 10px var(--screen-padding-x);
  margin: 0 calc(-1 * var(--screen-padding-x));

  &:hover {
    background-color: variables.$color-bg-4-hover;
  }

  .footer {
    @include mixins.flex(space-between, center, row);

    @extend %face-sans-12-regular;

    width: 100%;
    color: rgba(variables.$color-white, 0.75);
  }
}
</style>
