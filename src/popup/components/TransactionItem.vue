<template>
  <RouterLink
    class="transaction-item"
    :to="redirectRoute"
  >
    <div class="body">
      <TransactionTokens
        :ext-tokens="tokens"
        :error="isErrorTransaction"
        icon-size="md"
      />
      <div class="footer">
        <!-- TODO consensus and other multisig stuff, is todo in my another task SW-622       -->
        <div
          v-if="!!multisigTransaction && !hasConsensus"
          class="consensus"
        >
          <PendingIcon class="icon" />
          <span class="pending">
            {{ consensus }}
          </span>
        </div>

        <TransactionLabel
          v-else
          :transaction="currentTransaction"
          :transaction-date="transactionDate"
          :show-transaction-owner="showTransactionOwner"
          dense
        />

        <template v-if="!multisigTransaction">
          <span v-if="fiatAmount && !showTransactionOwner">{{ fiatAmount }}</span>
          <span
            v-else-if="showTransactionOwner"
            class="date"
          >
            {{ transactionDate }}
          </span>
        </template>
      </div>
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
import {
  ROUTE_MULTISIG_TX_DETAILS,
  ROUTE_TX_DETAILS,
  ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS,
} from '../router/routeNames';
import {
  IActiveMultisigTx,
  ITransaction,
  TxFunctionRaw,
} from '../../types';
import {
  useCurrencies,
  useTransactionTokens,
  useTransactionTx,
} from '../../composables';

import TransactionTokens from './TransactionTokenRows.vue';
import TransactionLabel from './TransactionLabel.vue';
import PendingIcon from '../../icons/animated-pending.svg?vue-component';

export default defineComponent({
  components: {
    PendingIcon,
    TransactionLabel,
    TransactionTokens,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, default: null },
    multisigTransaction: { type: Object as PropType<IActiveMultisigTx>, default: null },
    isMultisig: Boolean,
    showTransactionOwner: Boolean,
    hasConsensus: Boolean,
  },
  setup(props, { root }) {
    const { getFormattedAndRoundedFiat } = useCurrencies();

    const currentTransaction = computed(
      () => (props.multisigTransaction || props.transaction),
    );

    const transactionOwner = computed((): string | undefined => (
      props.transaction?.transactionOwner || undefined
    ));

    const {
      isDex,
      direction,
      isAllowance,
      isErrorTransaction,
    } = useTransactionTx({
      store: root.$store,
      tx: currentTransaction.value.tx,
      externalAddress: transactionOwner.value,
    });

    const { tokens } = useTransactionTokens({
      store: root.$store,
      direction: direction.value,
      isAllowance: isAllowance.value,
      // TODO - refactor useTransactionTokens to use only tx
      transaction: (props.multisigTransaction || props.transaction) as unknown as ITransaction,
    });

    const transactionDate = computed(
      () => props.transaction
        ? relativeTimeTo(dayjs(props.transaction.microTime).toISOString())
        : undefined,
    );

    const redirectRoute = computed<any>(() => {
      if (props.multisigTransaction) {
        return { name: ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS };
      }

      return {
        name: props.isMultisig
          ? ROUTE_MULTISIG_TX_DETAILS
          : ROUTE_TX_DETAILS,
        params: {
          hash: props.transaction.hash,
          transactionOwner: props.transaction.transactionOwner,
        },
      };
    });

    const getConsensusInfo = computed(() => ({
      confirmedBy: props.multisigTransaction?.totalConfirmations,
      totalSigners: props.multisigTransaction?.signers?.length,
      confirmationsRequired: props.multisigTransaction?.confirmationsRequired?.toString(),
    }));

    const fiatAmount = computed(() => {
      const aeToken = tokens.value?.find((t) => t?.isAe);
      if (
        !aeToken
        || isErrorTransaction.value
        || (
          isDex.value
          && FUNCTION_TYPE_DEX.pool.includes(currentTransaction.value.tx?.function as TxFunctionRaw)
        )
      ) return 0;
      return getFormattedAndRoundedFiat(
        +amountRounded((aeToken.decimals
          ? convertToken(aeToken.amount || 0, -aeToken.decimals)
          : aeToken.amount)!),
      );
    });

    const consensus = computed(() => `${root.$t('multisig.consensusPending')}
       ${getConsensusInfo.value.confirmedBy}/${getConsensusInfo.value.confirmationsRequired}
       ${root.$t('common.of')} ${getConsensusInfo.value.totalSigners}`);

    return {
      redirectRoute,
      fiatAmount,
      transactionDate,
      isErrorTransaction,
      tokens,
      currentTransaction,
      transactionOwner,
      consensus,
      getConsensusInfo,
      direction,
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
  transition: all 0.25s ease-out;

  &:hover {
    background-color: variables.$color-bg-4-hover;
  }

  .body {
    width: 100%;

    .footer {
      @include mixins.flex(space-between, center, row);

      @extend %face-sans-12-regular;

      width: 100%;
      color: rgba(variables.$color-white, 0.75);

      .date {
        white-space: nowrap;
      }
    }
  }

  .consensus {
    @extend %face-sans-12-medium;

    display: flex;
    align-items: center;
    gap: 6px;

    .icon {
      width: 16px;
      height: 16px;
    }
  }
}
</style>
