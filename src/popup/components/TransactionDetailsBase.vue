<template>
  <div class="transaction-details-base">
    <div
      v-if="showHeader || isErrorTransaction"
      class="header"
    >
      <TransactionErrorStatus
        v-if="isErrorTransaction"
        :return-type="transaction?.tx?.returnType"
      />
      <slot name="tokens" />
    </div>

    <div
      v-if="transaction"
      class="content"
    >
      <TransactionOverview :transaction="transaction" />

      <div class="explorer-link">
        <LinkButton
          :href="explorerUrl!"
          :text="$t('pages.transactionDetails.explorer')"
          variant="muted"
          is-external
          underlined
        />
      </div>
      <div class="data-grid">
        <slot
          v-if="!isErrorTransaction"
          name="swap-data"
        />
        <DetailsItem
          v-if="isErrorTransaction"
          :label="$t('pages.transactionDetails.reason')"
          :value="transaction.tx.return"
          class="reason"
          data-cy="reason"
        />
        <slot name="additional-content" />

        <DetailsItem
          v-if="contractId && isContract(contractId)"
          :label="$t('common.smartContract')"
          small
        >
          <template #value>
            <CopyText
              hide-icon
              :value="contractId"
              :copied-text="$t('common.hashCopied')"
            >
              <span class="text-address">{{ splitAddress(contractId) }}</span>
            </CopyText>
          </template>
        </DetailsItem>

        <DetailsItem
          :label="$t('pages.transactionDetails.hash')"
          data-cy="hash"
          small
        >
          <template #value>
            <CopyText
              hide-icon
              :value="hash"
              :copied-text="$t('common.hashCopied')"
            >
              <span class="text-address">{{ splitAddress(hash) }}</span>
            </CopyText>
          </template>
        </DetailsItem>

        <slot name="multisig-content" />

        <PayloadDetails :payload="payload" />

        <div class="span-3-columns">
          <DetailsItem
            v-if="transaction.pending"
            :label="$t('pages.transactionDetails.timestamp')"
            data-cy="timestamp"
          >
            <template #value>
              <AnimatedPending
                class="pending-icon"
              />
              {{ $t('common.pending') }}
            </template>
          </DetailsItem>
          <DetailsItem
            v-else-if="transaction.microTime"
            :value="formatDate(transaction.microTime)"
            :secondary="formatTime(transaction.microTime)"
            :label="$t('pages.transactionDetails.timestamp')"
            data-cy="timestamp"
          />
          <DetailsItem
            v-if="transaction.blockHeight && transaction.blockHeight > 0"
            :value="transaction.blockHeight"
            :label="$t('pages.transactionDetails.blockHeight')"
            data-cy="block-height"
          />
          <DetailsItem
            v-if="transaction.tx.nonce"
            :value="transaction.tx.nonce"
            :label="$t('pages.transactionDetails.nonce')"
            data-cy="nonce"
          />
        </div>

        <DetailsItem
          v-if="transaction.tx.function"
          :label="$t('modals.confirmTransactionSign.functionName')"
          :value="transaction.tx.function"
        />

        <DetailsItem
          v-if="amount"
          :label="$t('common.amount')"
          data-cy="amount"
        >
          <template #value>
            <TokenAmount
              :amount="amount"
              :symbol="assetSymbol"
              :hide-fiat="hideFiat"
              :hide-symbol="!assetSymbol"
              :protocol="protocol"
              :price="price"
              high-precision
            />
          </template>
        </DetailsItem>

        <slot name="gas" />

        <DetailsItem
          v-if="fee"
          :label="$t('transaction.fee')"
          data-cy="fee"
        >
          <template #value>
            <TokenAmount
              :amount="fee"
              :symbol="coinSymbol"
              :protocol="protocol"
              high-precision
            />
          </template>
        </DetailsItem>

        <DetailsItem
          v-if="!hideAmountTotal"
          :label="$t('common.total')"
          data-cy="total"
        >
          <template #value>
            <TokenAmount
              :amount="amountTotal"
              :symbol="assetSymbol"
              :hide-fiat="hideFiat"
              :protocol="protocol"
              high-precision
            />
          </template>
        </DetailsItem>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';

import type { Protocol, ITransaction } from '@/types';
import {
  formatDate,
  formatTime,
  splitAddress,
} from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useFungibleTokens } from '@/composables';
import { isContract } from '@/protocols/aeternity/helpers';

import TransactionOverview from '@/popup/components/TransactionOverview.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import LinkButton from '@/popup/components/LinkButton.vue';
import CopyText from '@/popup/components/CopyText.vue';
import PayloadDetails from '@/popup/components/PayloadDetails.vue';
import TransactionErrorStatus from '@/popup/components/TransactionErrorStatus.vue';

import AnimatedPending from '@/icons/animated-pending.svg?vue-component';

export default defineComponent({
  components: {
    PayloadDetails,
    TransactionErrorStatus,
    TransactionOverview,
    TokenAmount,
    DetailsItem,
    LinkButton,
    CopyText,
    AnimatedPending,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, default: null },
    /**
     * Amount without fee
     */
    amount: { type: Number, default: 0 },
    /**
     * Amount + Fee
     * TODO calculate this value within the scope of this component
     */
    amountTotal: { type: Number, default: 0 },
    fee: { type: Number, default: 0 },
    payload: { type: String, default: '' },
    hash: { type: String, required: true },
    protocol: { type: String as PropType<Protocol>, required: true },
    price: { type: Number, default: undefined },
    isErrorTransaction: Boolean,
    showHeader: Boolean,
    hideAmountTotal: Boolean,
    hideFiat: Boolean,
  },
  setup(props) {
    const adapter = ProtocolAdapterFactory.getAdapter(props.protocol);
    const { coinSymbol } = adapter;

    const { getTxAssetSymbol } = useFungibleTokens();

    const explorerUrl = computed(
      () => adapter.getExplorer().prepareUrlForHash(props?.transaction?.hash || ''),
    );

    const contractId = computed(() => props.transaction?.tx?.contractId);

    const assetSymbol = computed(() => getTxAssetSymbol(props.transaction));

    return {
      formatDate,
      formatTime,
      splitAddress,
      isContract,
      assetSymbol,
      coinSymbol,
      contractId,
      explorerUrl,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.transaction-details-base {
  display: flex;
  flex-direction: column;

  .pending-icon {
    width: 16px;
    height: 16px;
  }

  .header {
    @include mixins.flex(center, center, column);

    min-height: 73px;
    position: initial;
    background-color: $color-bg-app;

    @include mixins.mobile {
      width: 100%;
    }
  }

  .span-3-columns {
    @include mixins.flex(flex-start, flex-start);

    column-gap: 24px;
  }

  .content {
    background-color: $color-bg-4;

    .transaction-overview {
      padding: 16px 12px 8px;
    }

    .pool-tokens.reverse {
      flex-direction: column-reverse;
    }

    .data-grid {
      @include mixins.flex(flex-start, flex-start, column);

      column-gap: 24px;
      row-gap: 8px;
      padding: 8px 16px;
    }

    .explorer-link {
      @extend %face-sans-14-medium;

      margin-block: 8px;
      padding-inline: 16px; // TODO wrap content and set inline padding once
    }
  }

  .details-item:deep() {
    .label {
      white-space: nowrap;
    }
  }

  .reason:deep() {
    .value {
      word-break: break-all;
      color: $color-warning;
    }
  }
}
</style>
