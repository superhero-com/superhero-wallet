<template>
  <div class="transaction-details">
    <div class="header">
      <TokenAmount :amount="amount" :symbol="symbol" :direction="direction" large />
    </div>
    <div class="content">
      <div class="visual-overview"><!-- TODO --></div>
      <div class="data-grid">
        <InfoBox
          v-if="tipUrl"
          :label="$t('pages.transactionDetails.tipUrl')"
          class="span-2-columns"
          data-cy="tip-url"
        >
          <CopyButton slot="label" :value="tipUrl" message="URL copied" />
          <LinkButton slot="value" :to="tipUrl">{{ tipUrl }}</LinkButton>
        </InfoBox>
        <InfoBox
          :value="hash"
          :label="$t('pages.transactionDetails.hash')"
          class="span-2-columns"
          data-cy="hash"
          small
        >
          <CopyButton slot="label" :value="hash" message="Hash copied" />
        </InfoBox>
        <InfoBox
          v-if="microTime"
          :value="microTime | formatDate"
          :secondary="microTime | formatTime"
          :label="$t('pages.transactionDetails.timestamp')"
          data-cy="timestamp"
        />
        <InfoBox
          v-if="blockHeight && blockHeight > 0"
          :value="blockHeight"
          :label="$t('pages.transactionDetails.blockHeight')"
          data-cy="block-height"
        />
        <InfoBox
          v-if="tx.gasUsed"
          :value="tx.gasUsed"
          :label="$t('pages.transactionDetails.gas')"
          data-cy="gas"
        />
        <InfoBox
          v-if="tx.gasPrice"
          :label="$t('pages.transactionDetails.gasPrice')"
          data-cy="gas-price"
        >
          <TokenAmount slot="value" :amount="tx.gasPrice" symbol="ættos" hideFiat />
        </InfoBox>
        <InfoBox :label="$t('pages.transactionDetails.amount')" data-cy="amount">
          <TokenAmount slot="value" :amount="amount" :symbol="symbol" hideFiat />
        </InfoBox>
        <InfoBox
          v-if="tx.nonce"
          :value="tx.nonce"
          :label="$t('pages.transactionDetails.nonce')"
          data-cy="nonce"
        />
        <InfoBox
          v-if="tx.fee"
          :label="$t('pages.transactionDetails.fee')"
          class="span-2-columns"
          data-cy="fee"
        >
          <TokenAmount slot="value" :amount="tx.fee" symbol="ættos" hideFiat />
        </InfoBox>
        <InfoBox
          v-if="pending"
          :value="$t('pages.transactionDetails.pending')"
          :label="$t('pages.transactionDetails.status')"
          data-cy="status"
          highlight
        />
      </div>
      <div class="explorer">
        <LinkButton :to="getExplorerPath(hash)">
          <AnimatedPending v-if="pending" />
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
import InfoBox from '../components/InfoBox';
import LinkButton from '../components/LinkButton';
import CopyButton from '../components/CopyButton';
import AnimatedPending from '../../../icons/animated-pending.svg?vue-component';
import BlockIcon from '../../../icons/block.svg?vue-component';

export default {
  name: 'TransactionDetails',
  components: {
    TokenAmount,
    InfoBox,
    LinkButton,
    CopyButton,
    AnimatedPending,
    BlockIcon,
  },
  props: {
    tx: { type: Object, required: true },
    hash: { type: String, required: true },
    microTime: { type: Number, required: false },
    blockHeight: { type: Number },
    amount: { type: Number, required: true },
    symbol: { type: String, required: true },
    direction: { type: String, required: true },
    txType: { type: String },
    tipUrl: { type: String },
    pending: { type: Boolean },
  },
  filters: {
    formatDate,
    formatTime,
  },
  beforeRouteEnter(to, from, next) {
    if (!to.params.tx) next({ path: '/transactions', replace: true });
    next();
  },
  computed: mapGetters(['getExplorerPath']),
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
    width: #{2px + $container-width};
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
