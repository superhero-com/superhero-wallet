<template>
  <ListItemWrapper
    class="transaction-item"
    :to="redirectRoute"
    :data-cy="currentTransaction.pending ? 'pending-txs' : null"
    replace
  >
    <div class="body">
      <TransactionAssetRows
        :assets="transactionAssets"
        :error="isErrorTransaction"
        :protocol="transactionProtocol"
        icon-size="rg"
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
          <span
            v-if="fiatAmount && !showTransactionOwner"
            v-text="fiatAmount"
          />
          <span
            v-else-if="showTransactionOwner"
            class="date"
            v-text="transactionDate"
          />
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
} from 'vue';
import { RouteLocation } from 'vue-router';
import dayjs from 'dayjs';
import type {
  IActiveMultisigTransaction,
  ITransaction,
} from '@/types';
import { ASSET_TYPES, PROTOCOLS } from '@/constants';
import {
  amountRounded,
  executeAndSetInterval,
  formatDate,
  formatTime,
  relativeTimeTo,
} from '@/utils';
import {
  useCurrencies,
  useTransactionData,
} from '@/composables';
import {
  ROUTE_MULTISIG_TX_DETAILS,
  ROUTE_TX_DETAILS,
  ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS,
} from '@/popup/router/routeNames';

import TransactionAssetRows from './TransactionAssetRows.vue';
import TransactionLabel from './TransactionLabel.vue';
import ListItemWrapper from './ListItemWrapper.vue';
import ConsensusApprovedLabel from './ConsensusApprovedLabel.vue';

export default defineComponent({
  components: {
    ConsensusApprovedLabel,
    TransactionLabel,
    TransactionAssetRows,
    ListItemWrapper,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, default: null },
    multisigTransaction: { type: Object as PropType<IActiveMultisigTransaction>, default: null },
    hideFeeFromAssets: Boolean,
    isMultisig: Boolean,
    showTransactionOwner: Boolean,
    hasConsensus: Boolean,
  },
  setup(props) {
    const { getFormattedAndRoundedFiat } = useCurrencies();

    let timerInterval: NodeJS.Timeout;
    const transactionDate = ref();

    const currentTransaction = computed(
      (): ITransaction => (props.multisigTransaction as any || props.transaction),
    );

    // temp if protocol undefined assume it is aeternity
    const transactionProtocol = computed(() => props.transaction?.protocol ?? PROTOCOLS.aeternity);

    const transactionCustomOwner = computed(() => props.multisigTransaction
      ? props.multisigTransaction?.tx?.senderId
      : props.transaction?.transactionOwner);

    const {
      direction,
      isDexPool,
      isErrorTransaction,
      transactionAssets,
    } = useTransactionData({
      transaction: currentTransaction,
      transactionCustomOwner,
      hideFeeFromAssets: props.hideFeeFromAssets,
    });

    const redirectRoute = computed((): Partial<RouteLocation> => {
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
      const tokenAsset = transactionAssets.value[0];
      const protocolCoin = transactionAssets.value?.find(
        ({ assetType }) => assetType === ASSET_TYPES.coin,
      );
      if (
        (!tokenAsset?.price && !protocolCoin)
        || isErrorTransaction.value
        || isDexPool.value
      ) {
        return 0;
      }
      return getFormattedAndRoundedFiat(
        +amountRounded(
          tokenAsset?.price && tokenAsset?.amount
            ? +tokenAsset.amount * tokenAsset.price
            : protocolCoin?.amount || 0,
        ),
        transactionProtocol.value,
      );
    });

    onMounted(() => {
      timerInterval = executeAndSetInterval(() => {
        transactionDate.value = (props.transaction?.microTime)
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
      currentTransaction,
      transactionAssets,
      transactionProtocol,
      direction,
      formatDate,
      formatTime,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.transaction-item {
  .body {
    width: 100%;

    .footer {
      @include mixins.flex(space-between, center, row);

      @extend %face-sans-12-regular;

      width: 100%;
      color: rgba($color-white, 0.75);
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
