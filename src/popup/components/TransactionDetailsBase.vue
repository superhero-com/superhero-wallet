<template>
  <div class="transaction-details-base">
    <div
      v-if="!isDexAllowance || isErrorTransaction"
      class="header"
    >
      <TransactionErrorStatus
        v-if="isErrorTransaction"
        :return-type="transaction.tx.returnType"
      />
      <TransactionTokens
        :ext-tokens="noneAeCoin"
        :is-rounded="!!noneAeCoin"
        :transaction="transaction"
        :direction="direction"
        :is-allowance="isDexAllowance"
        :error="isErrorTransaction"
        :class="{ reverse: isPool }"
        icon-size="md"
      />
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
        <template v-if="isSwap && !isErrorTransaction">
          <SwapRates :transaction="transaction" />
          <SwapRoute :transaction="transaction" />
        </template>
        <DetailsItem
          v-if="isErrorTransaction"
          :label="$t('pages.transactionDetails.reason')"
          :value="transaction.tx.return"
          class="reason"
          data-cy="reason"
        />
        <TransactionDetailsPoolTokens
          v-if="(isPool || isDexAllowance)"
          :transaction="transaction"
          :direction="direction"
          :tx-function="transaction.tx.function"
          :is-allowance="isDexAllowance"
          :class="{ reverse: isPool }"
        />

        <slot name="tip-url" />

        <DetailsItem
          v-if="contractId"
          :label="$t('common.smartContract')"
          small
        >
          <template #value>
            <CopyText
              hide-icon
              :value="hash"
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

        <DetailsItem
          v-if="multisigTransactionFeePaidBy"
          :label="$t('pages.transactionDetails.feePaidBy')"
          small
        >
          <div class="row payer-id">
            <Avatar
              :address="multisigTransactionFeePaidBy"
              size="sm"
            />
            <div>
              <DialogBox
                v-if="isLocalAccountAddress(multisigTransactionFeePaidBy)"
                class="dialog-box"
                dense
                position="bottom"
              >
                {{ $t('common.you') }}
              </DialogBox>
              <CopyText
                hide-icon
                :value="multisigTransactionFeePaidBy"
                :copied-text="$t('common.addressCopied')"
              >
                <span class="text-address">
                  {{ splitAddress(multisigTransactionFeePaidBy) }}
                </span>
              </CopyText>
            </div>
          </div>
        </DetailsItem>

        <DetailsItem
          v-if="multisigContractId"
          :label="$t('pages.transactionDetails.vaultContractId')"
          small
        >
          <div class="row">
            <Avatar
              :address="multisigContractId"
              size="sm"
            />
            <CopyText
              hide-icon
              :value="multisigContractId"
              :copied-text="$t('common.addressCopied')"
            >
              <span class="text-address">
                {{ splitAddress(multisigContractId) }}
              </span>
            </CopyText>
          </div>
        </DetailsItem>

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
          v-if="!(isDex || isDexAllowance || isMultisig)"
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
        <DetailsItem
          v-if="gasPrice"
          :label="$t('pages.transactionDetails.gasPrice')"
          data-cy="gas-price"
        >
          <template #value>
            <TokenAmount
              :amount="+gasPrice"
              symbol="AE"
              hide-fiat
            />
          </template>
        </DetailsItem>
        <DetailsItem
          v-if="gasUsed"
          :value="gasUsed"
          :label="$t('pages.transactionDetails.gasUsed')"
          data-cy="gas"
        />
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

import { PROTOCOL_AETERNITY } from '@/constants';
import type { Protocol, ITransaction } from '@/types';
import {
  formatDate,
  formatTime,
  splitAddress,
} from '@/utils';

import TransactionOverview from '@/popup/components/TransactionOverview.vue';
import SwapRoute from '@/popup/components/SwapRoute.vue';
import SwapRates from '@/popup/components/SwapRates.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import LinkButton from '@/popup/components/LinkButton.vue';
import TransactionTokens from '@/popup/components/TransactionTokenRows.vue';
import CopyText from '@/popup/components/CopyText.vue';
import TransactionDetailsPoolTokens from '@/popup/components/TransactionDetailsPoolTokens.vue';
import PayloadDetails from '@/popup/components/PayloadDetails.vue';
import TransactionErrorStatus from '@/popup/components/TransactionErrorStatus.vue';
import Avatar from '@/popup/components/Avatar.vue';
import DialogBox from '@/popup/components/DialogBox.vue';

import AnimatedPending from '@/icons/animated-pending.svg?vue-component';
import ExternalLink from '@/icons/external-link.svg?vue-component';

export default defineComponent({
  components: {
    PayloadDetails,
    TransactionErrorStatus,
    TransactionDetailsPoolTokens,
    TransactionTokens,
    TransactionOverview,
    TokenAmount,
    DetailsItem,
    LinkButton,
    CopyText,
    SwapRoute,
    SwapRates,
    AnimatedPending,
    ExternalLink,
    Avatar,
    DialogBox,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction | undefined>, required: true },
    coinSymbol: { type: String, required: true },
    transactionFee: { type: Number, required: true },
    isSwap: { type: Boolean },
    isPool: { type: Boolean },
    tokenSymbol: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    isErrorTransaction: { type: Boolean },
    isDexAllowance: { type: Boolean },
    isDex: { type: Boolean },
    isTransactionAex9: { type: Boolean },
    payload: { type: String, default: '' },
    isMultisig: { type: Boolean },
    direction: { type: String, required: true },
    explorerUrl: { type: String, required: true },
    isLocalAccountAddress: { type: Function, default: () => false },
    gasPrice: { type: Number, default: 0 }, // In Ae
    gasUsed: { type: Number, default: 0 },
    contractId: { type: String, default: '' },
    multisigTransactionFeePaidBy: { type: String, default: '' },
    multisigContractId: { type: String, default: '' },
    hash: { type: String, required: true },
    noneAeCoin: { type: Array, default: null },
    protocol: { type: String as PropType<Protocol>, default: PROTOCOL_AETERNITY },
  },
  setup: () => ({
    formatDate,
    formatTime,
    splitAddress,
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

  .row {
    @include mixins.flex(flex-start, center, row);

    gap: 8px;
  }

  .header {
    @include mixins.flex(center, center, column);

    min-height: 73px;
    position: initial;

    @include mixins.mobile {
      width: 100%;
    }

    .transaction-token-rows {
      &.reverse {
        display: flex;
        flex-direction: column-reverse;
      }

      :deep(.token-row) {
        margin-bottom: 12px;
        padding-inline: 16px;

        .amount {
          @extend %face-sans-18-regular;
        }

        .tokens {
          @extend %face-sans-18-medium;

          color: rgba(variables.$color-white, 0.75);
        }
      }
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

    .payer-id {
      position: relative;

      .dialog-box {
        width: 30px;
        height: 20px;
        position: absolute;
        right: 15px;
        top: -28px;
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
