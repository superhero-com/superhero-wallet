<template>
  <ListItemWrapper
    class="transaction-item"
    :to="redirectRoute"
  >
    <div class="body">
      <TransactionTokenRows
        :ext-tokens="tokens"
        :error="isErrorTransaction"
        icon-size="md"
      />
      <div class="footer">
        <div
          v-if="!!multisigTransaction && !hasConsensus"
          class="consensus"
        >
          <ConsensusApprovedLabel
            :confirmations-required="multisigTransaction.confirmationsRequired"
            :has-pending-transaction="multisigTransaction.hasPendingTransaction"
            :confirmed-by="multisigTransaction.confirmedBy"
            :signers="multisigTransaction.signers"
          />
        </div>

        <TransactionLabel
          v-else
          :transaction="currentTransaction"
          :transaction-date="transactionDate"
          :show-transaction-owner="showTransactionOwner"
          dense
        />

        <template v-if="!multisigTransaction">
          <span v-if="fiatAmount && !showTransactionOwner">
            {{ fiatAmount }}
          </span>
          <span
            v-else-if="showTransactionOwner"
            class="date"
          >
            {{ transactionDate }}
          </span>
        </template>
      </div>
    </div>
  </ListItemWrapper>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
} from '@vue/composition-api';
import { Location } from 'vue-router';
import dayjs from 'dayjs';
import {
  FUNCTION_TYPE_DEX,
  amountRounded,
  convertToken,
  formatDate,
  formatTime,
  relativeTimeTo,
  executeAndSetInterval,
} from '../utils';
import {
  ROUTE_MULTISIG_TX_DETAILS,
  ROUTE_TX_DETAILS,
  ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS,
} from '../router/routeNames';
import {
  IActiveMultisigTransaction,
  ITransaction,
  TxFunctionRaw,
} from '../../types';
import {
  useCurrencies,
  useTransactionTokens,
  useTransactionTx,
} from '../../composables';

import TransactionTokenRows from './TransactionTokenRows.vue';
import TransactionLabel from './TransactionLabel.vue';
import ListItemWrapper from './ListItemWrapper.vue';
import ConsensusApprovedLabel from './ConsensusApprovedLabel.vue';

export default defineComponent({
  components: {
    ConsensusApprovedLabel,
    TransactionLabel,
    TransactionTokenRows,
    ListItemWrapper,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, default: null },
    multisigTransaction: { type: Object as PropType<IActiveMultisigTransaction>, default: null },
    isMultisig: Boolean,
    showTransactionOwner: Boolean,
    hasConsensus: Boolean,
  },
  setup(props, { root }) {
    const { getFormattedAndRoundedFiat } = useCurrencies();

    let timerInterval: NodeJS.Timer;
    const transactionDate = ref();

    const currentTransaction = computed(
      () => (props.multisigTransaction || props.transaction),
    );

    const transactionOwner = computed(() => props.transaction?.transactionOwner);

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

    const redirectRoute = computed((): Location => {
      if (props.multisigTransaction) {
        return { name: ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS };
      }

      return {
        name: props.isMultisig
          ? ROUTE_MULTISIG_TX_DETAILS
          : ROUTE_TX_DETAILS,
        params: {
          hash: props.transaction.hash,
          transactionOwner: props.transaction.transactionOwner || '',
        },
      };
    });

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

    onMounted(() => {
      timerInterval = executeAndSetInterval(() => {
        transactionDate.value = (props.transaction)
          ? relativeTimeTo(dayjs(props.transaction.microTime).toISOString())
          : undefined;
      }, 5000);
    });

    onBeforeUnmount(() => {
      clearInterval(timerInterval);
    });

    return {
      redirectRoute,
      fiatAmount,
      transactionDate,
      isErrorTransaction,
      tokens,
      currentTransaction,
      transactionOwner,
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
  .body {
    width: 100%;

    .footer {
      @include mixins.flex(space-between, center, row);

      @extend %face-sans-12-regular;

      width: 100%;
      color: rgba(variables.$color-white, 0.75);
      gap: 3px;

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