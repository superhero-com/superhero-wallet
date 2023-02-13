<template>
  <RouterLink
    class="transaction-item"
    :to="redirectRoute"
  >
    <div class="header">
      <span />
      <div class="status">
        <template v-if="!!multisigTransaction && !hasConsensus">
          <PendingIcon class="icon" />
          <span class="pending">
            {{ $t('multisig.consensusPending') }}
            {{ getConsensusInfo.confirmedBy }}/{{ getConsensusInfo.confirmationsRequired }}
            {{ $t('of') }}
            {{ getConsensusInfo.totalSigners }}
          </span>
        </template>
        <template v-else-if="transaction.pending">
          <PendingIcon class="icon" />
          <span class="pending">{{ $t('transaction.type.pending') }}</span>
        </template>
        <template v-else>
          <span data-cy="date">{{ formatDate(transaction.microTime) }}</span>
          <span data-cy="time">{{ formatTime(transaction.microTime) }}</span>
          <div
            v-if="isErrorTransaction"
            class="error"
          >
            <WarningIcon
              v-if="currentTx.returnType === 'abort'"
              class="icon"
            />
            <RevertedIcon
              v-else
              class="icon"
            />
            <span>{{ $t('transaction.returnType')[currentTx.returnType] }}</span>
          </div>
        </template>
      </div>
      <span />
    </div>
    <div class="body">
      <TransactionTokens
        :ext-tokens="tokens"
        :error="isErrorTransaction"
      />
      <div class="footer">
        <TransactionTagList
          :tx="currentTx"
          :is-incomplete="!!transaction && transaction.incomplete"
          :is-pending="!!transaction && transaction.pending"
          :is-claim="!!transaction && transaction.claim"
          dense
        />
        <span v-if="fiatAmount">{{ fiatAmount }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from '@vue/composition-api';
import { Location } from 'vue-router';

import type {
  IActiveMultisigTx,
  ITransaction,
  ITx,
  TxFunctionRaw,
} from '../../types';
import {
  FUNCTION_TYPE_DEX,
  amountRounded,
  convertToken,
  formatDate,
  formatTime,
} from '../utils';
import { useTransactionTx, useTransactionTokens } from '../../composables';
import { useGetter } from '../../composables/vuex';
import { ROUTE_ACCOUNT_DETAILS_MULTISIG_PROPOSAL_DETAILS } from '../router/routeNames';

import TransactionTokens from './TransactionTokenRows.vue';

import PendingIcon from '../../icons/animated-pending.svg?vue-component';
import RevertedIcon from '../../icons/refresh.svg?vue-component';
import WarningIcon from '../../icons/warning.svg?vue-component';
import TransactionTagList from './TransactionTagList.vue';

export default defineComponent({
  components: {
    TransactionTagList,
    PendingIcon,
    RevertedIcon,
    WarningIcon,
    TransactionTokens,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, default: null },
    multisigTransaction: { type: Object as PropType<IActiveMultisigTx>, default: null },
    hasConsensus: Boolean,
  },
  setup(props, { root }) {
    const getAmountFiat = useGetter('getAmountFiat');

    const currentTx = computed<ITx | undefined>(
      () => (props.multisigTransaction || props.transaction)?.tx,
    );

    const {
      isDex,
      isErrorTransaction,
      direction,
      isAllowance,
    } = useTransactionTx({
      store: root.$store,
      tx: currentTx.value,
    });

    const { tokens } = useTransactionTokens({
      store: root.$store,
      direction: direction.value,
      isAllowance: isAllowance.value,
      // TODO - refactor useTransactionTokens to use only tx
      transaction: (props.multisigTransaction || props.transaction) as unknown as ITransaction,
    });

    const redirectRoute = computed<Location>(() => {
      if (props.multisigTransaction) {
        return { name: ROUTE_ACCOUNT_DETAILS_MULTISIG_PROPOSAL_DETAILS };
      }
      return { name: 'tx-details', params: { hash: props.transaction.hash } };
    });

    const getConsensusInfo = computed(() => ({
      confirmedBy: props.multisigTransaction.confirmedBy?.length || 0,
      totalSigners: props.multisigTransaction.signers?.length || 0,
      confirmationsRequired: props.multisigTransaction.confirmationsRequired?.toString(),
    }));

    const fiatAmount = computed(() => {
      const aeToken = tokens.value?.find((t) => t?.isAe);
      if (
        !aeToken
        || isErrorTransaction.value
        || (
          isDex.value
          && FUNCTION_TYPE_DEX.pool.includes(currentTx.value?.function as TxFunctionRaw)
        )
      ) return 0;
      return getAmountFiat.value(amountRounded(
        aeToken.decimals
          ? convertToken(aeToken.amount || 0, -aeToken.decimals)
          : aeToken.amount,
      ));
    });

    return {
      fiatAmount,
      formatDate,
      formatTime,
      getConsensusInfo,
      isErrorTransaction,
      tokens,
      isAllowance,
      direction,
      currentTx,
      redirectRoute,
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
    }
  }
}
</style>
