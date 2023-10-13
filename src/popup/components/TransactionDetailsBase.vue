<template>
  <div class="transaction-details-base">
    <div
      v-if="showHeader || isErrorTransaction"
      class="header"
    >
      <TransactionErrorStatus
        v-if="isErrorTransaction"
        :return-type="transaction.tx.returnType"
      />
      <slot name="tokens" />
    </div>
    <div class="content">
      <TransactionOverview :transaction="transaction" />

      <div class="explorer">
        <LinkButton :to="explorerUrl">
          {{ $t('pages.transactionDetails.explorer') }}
          <template #icon>
            <ExternalLink />
          </template>
        </LinkButton>
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
            v-if="transaction.microTime && !transaction.pending"
            :value="formatDate(transaction.microTime)"
            :secondary="formatTime(transaction.microTime)"
            :label="$t('pages.transactionDetails.timestamp')"
            data-cy="timestamp"
          />
          <DetailsItem
            v-else-if="transaction.pending"
            :label="$t('pages.transactionDetails.timestamp')"
            data-cy="timestamp"
          >
            <template #value>
              <AnimatedPending
                class="pending-icon"
              />
              {{ $t('common.pending') }}...
            </template>
          </DetailsItem>
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
          v-if="!hideAmount"
          :label="$t('common.amount')"
          data-cy="amount"
        >
          <template #value>
            <TokenAmount
              :amount="totalAmount"
              :symbol="tokenSymbol"
              :hide-fiat="isTransactionAex9"
              :high-precision="!!noneAeCoin"
              :protocol="protocol"
            />
          </template>
        </DetailsItem>

        <slot name="gas" />

        <DetailsItem
          v-if="transactionFee"
          :label="$t('transaction.fee')"
          data-cy="fee"
        >
          <template #value>
            <TokenAmount
              :amount="transactionFee"
              :symbol="coinSymbol"
              :protocol="protocol"
              :high-precision="!!noneAeCoin"
            />
          </template>
        </DetailsItem>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { Protocol, ITransaction } from '@/types';
import {
  formatDate,
  formatTime,
  splitAddress,
} from '@/utils';
import { isContract } from '@/protocols/aeternity/helpers';

import TransactionOverview from '@/popup/components/TransactionOverview.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import LinkButton from '@/popup/components/LinkButton.vue';
import CopyText from '@/popup/components/CopyText.vue';
import PayloadDetails from '@/popup/components/PayloadDetails.vue';
import TransactionErrorStatus from '@/popup/components/TransactionErrorStatus.vue';

import AnimatedPending from '@/icons/animated-pending.svg?vue-component';
import ExternalLink from '@/icons/external-link.svg?vue-component';

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
    ExternalLink,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction | undefined>, required: true },
    coinSymbol: { type: String, required: true },
    transactionFee: { type: Number, required: true },
    tokenSymbol: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    payload: { type: String, default: '' },
    explorerUrl: { type: String, required: true },
    contractId: { type: String, default: '' },
    hash: { type: String, required: true },
    noneAeCoin: { type: Array, default: null },
    protocol: { type: String as PropType<Protocol>, required: true },
    isErrorTransaction: Boolean,
    showHeader: Boolean,
    hideAmount: Boolean,
    isTransactionAex9: Boolean,
  },
  setup: () => ({
    formatDate,
    formatTime,
    splitAddress,
    isContract,
  }),
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables';
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

    @include mixins.mobile {
      width: 100%;
    }
  }

  .span-3-columns {
    @include mixins.flex(flex-start, flex-start);

    column-gap: 24px;
  }

  .content {
    background-color: variables.$color-bg-4;

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

    .explorer {
      height: 38px;
      padding-inline: 16px;
      display: flex;
      align-items: center;

      .link-button {
        @extend %face-sans-14-medium;

        text-decoration: none;
        color: rgba(variables.$color-white, 0.75);

        svg {
          opacity: 1;
          color: rgba(variables.$color-white, 0.75);
          width: 24px;
          height: 24px;
        }

        &:hover {
          color: variables.$color-white;
          text-decoration: underline;

          svg {
            color: variables.$color-white;
          }
        }
      }
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
      color: variables.$color-warning;
    }
  }
}
</style>
