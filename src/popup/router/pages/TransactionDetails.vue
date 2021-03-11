<template>
  <div class="transaction-details">
    <div class="header">
      <TokenAmount :amount="amount" :symbol="symbol" :direction="direction" large />
    </div>
    <div class="content">
      <div class="visual-overview"><!-- TODO --></div>
      <div class="data-grid">
        <DetailsItem
          v-if="tipUrl"
          :label="$t('pages.transactionDetails.tipUrl')"
          class="span-2-columns"
          data-cy="tip-url"
        >
          <CopyButton slot="label" :value="tipUrl" message="URL copied" />
          <LinkButton slot="value" :to="tipUrl">{{ tipUrl }}</LinkButton>
        </DetailsItem>
        <DetailsItem
          :value="hash"
          :label="$t('pages.transactionDetails.hash')"
          class="span-2-columns"
          data-cy="hash"
          small
        >
          <CopyButton slot="label" :value="hash" message="Hash copied" />
        </DetailsItem>
        <DetailsItem
          v-if="transaction.microTime"
          :value="transaction.microTime | formatDate"
          :secondary="transaction.microTime | formatTime"
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
          v-if="transaction.tx.gasUsed"
          :value="transaction.tx.gasUsed"
          :label="$t('pages.transactionDetails.gas')"
          data-cy="gas"
        />
        <DetailsItem
          v-if="transaction.tx.gasPrice"
          :label="$t('pages.transactionDetails.gasPrice')"
          data-cy="gas-price"
        >
          <TokenAmount slot="value" :amount="transaction.tx.gasPrice" symbol="ættos" hideFiat />
        </DetailsItem>
        <DetailsItem :label="$t('pages.transactionDetails.amount')" data-cy="amount">
          <TokenAmount slot="value" :amount="amount" :symbol="symbol" hideFiat />
        </DetailsItem>
        <DetailsItem
          v-if="transaction.tx.nonce"
          :value="transaction.tx.nonce"
          :label="$t('pages.transactionDetails.nonce')"
          data-cy="nonce"
        />
        <DetailsItem
          v-if="transaction.tx.fee"
          :label="$t('pages.transactionDetails.fee')"
          class="span-2-columns"
          data-cy="fee"
        >
          <TokenAmount slot="value" :amount="transaction.tx.fee" symbol="ættos" hideFiat />
        </DetailsItem>
        <DetailsItem
          v-if="transaction.pending"
          :value="$t('pages.transactionDetails.pending')"
          :label="$t('pages.transactionDetails.status')"
          data-cy="status"
          highlight
        />
      </div>
      <div class="explorer">
        <LinkButton :to="getExplorerPath(hash)">
          <AnimatedPending v-if="transaction.pending" />
          <BlockIcon v-else />
          {{ $t('pages.transactionDetails.explorer') }}
        </LinkButton>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { formatDate, formatTime } from '../../utils';
import TokenAmount from '../components/TokenAmount';
import DetailsItem from '../components/DetailsItem';
import LinkButton from '../components/LinkButton';
import CopyButton from '../components/CopyButton';
import AnimatedPending from '../../../icons/animated-pending.svg?vue-component';
import BlockIcon from '../../../icons/block.svg?vue-component';

export default {
  name: 'TransactionDetails',
  components: {
    TokenAmount,
    DetailsItem,
    LinkButton,
    CopyButton,
    AnimatedPending,
    BlockIcon,
  },
  props: {
    hash: { type: String, required: true },
  },
  filters: {
    formatDate,
    formatTime,
  },
  computed: {
    ...mapGetters([
      'getTx',
      'getTxSymbol',
      'getTxAmountTotal',
      'getTxDirection',
      'getTxTipUrl',
      'getExplorerPath',
    ]),
    transaction() {
      return this.getTx(this.hash);
    },
    amount() {
      return this.getTxAmountTotal(this.transaction);
    },
    symbol() {
      return this.getTxSymbol(this.transaction);
    },
    direction() {
      return this.getTxDirection(this.transaction);
    },
    tipUrl() {
      return this.getTxTipUrl(this.transaction);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';
@import '../../../styles/typography';

.transaction-details {
  overflow-x: hidden;

  .header {
    position: fixed;
    z-index: 1;
    display: flex;
    justify-content: center;
    height: 92px;
    width: #{2px + $extension-width};
    margin: -1px 0 0 -1px;
    border: 1px solid rgba($color-border, 0.5);
    border-radius: 0 0 10px 10px;
    background: linear-gradient(180deg, $color-bg-3 0%, $color-black 100%);

    .token-amount {
      text-align: center;
      margin: 16px 0 24px 0;

      ::v-deep .text {
        display: block;
        padding-top: 4px;
        line-height: 24px;
      }
    }
  }

  .content {
    margin-top: -10px;
    padding-top: 92px;
    background: $color-bg-3;

    .visual-overview {
      margin: 18px 0 8px 0;
    }

    .data-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-auto-rows: 64px;
      row-gap: 8px;
      column-gap: 24px;
      margin: 0 16px 8px 16px;

      .span-2-columns {
        grid-column-end: span 2;
      }
    }

    .explorer {
      height: 56px;
      margin: 0 16px;
      padding: 8px 0 24px 0;

      .link-button {
        @extend %face-sans-14-medium;
      }
    }
  }
}
</style>
