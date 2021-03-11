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
        >
          <CopyButton slot="label" :value="tipUrl" message="URL copied" />
          <a slot="value" @click="openTipUrl">{{ tipUrl }}</a>
        </InfoBox>
        <InfoBox
          :value="hash"
          :label="$t('pages.transactionDetails.hash')"
          class="span-2-columns"
          small
        >
          <CopyButton slot="label" :value="hash" message="Hash copied" />
        </InfoBox>
        <InfoBox
          :value="microTime | formatDate"
          :secondary="microTime | formatTime"
          :label="$t('pages.transactionDetails.timestamp')"
        />
        <InfoBox
          v-if="blockHeight"
          :value="blockHeight"
          :label="$t('pages.transactionDetails.blockHeight')"
        />
        <InfoBox v-if="tx.gas" :value="tx.gas" :label="$t('pages.transactionDetails.gas')" />
        <InfoBox v-if="tx.gasPrice" :label="$t('pages.transactionDetails.gasPrice')">
          <TokenAmount slot="value" :amount="tx.gasPrice" symbol="ættos" hideFiat />
        </InfoBox>
        <InfoBox :label="$t('pages.transactionDetails.amount')">
          <TokenAmount slot="value" :amount="amount" :symbol="symbol" hideFiat />
        </InfoBox>
        <InfoBox v-if="tx.nonce" :value="tx.nonce" :label="$t('pages.transactionDetails.nonce')" />
        <InfoBox
          v-if="pending"
          :value="$t('pages.transactionDetails.pending')"
          :label="$t('pages.transactionDetails.status')"
          highlight
        />
        <InfoBox v-if="tx.fee" :label="$t('pages.transactionDetails.fee')" class="span-2-columns">
          <TokenAmount slot="value" :amount="tx.fee" symbol="ættos" hideFiat />
        </InfoBox>
      </div>
      <div class="action-row">
        <a @click="openExplorer">
          <AnimatedPending v-if="pending" />
          <BlockIcon v-else />
          {{ $t('pages.transactionDetails.explorer') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { formatDate, formatTime } from '../../utils';
import openUrl from '../../utils/openUrl';
import TokenAmount from '../components/TokenAmount';
import InfoBox from '../components/InfoBox';
import CopyButton from '../components/CopyButton';
import AnimatedPending from '../../../icons/animated-pending.svg?vue-component';
import BlockIcon from '../../../icons/block.svg?vue-component';

export default {
  name: 'TransactionDetails',
  components: {
    TokenAmount,
    InfoBox,
    CopyButton,
    AnimatedPending,
    BlockIcon,
  },
  props: {
    tx: { type: Object, required: true },
    hash: { type: String, required: true },
    microTime: { type: Number, required: true },
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
  methods: {
    openExplorer() {
      const url = this.getExplorerPath(this.hash);
      if (url) openUrl(url, true);
    },
    openTipUrl() {
      openUrl(this.tipUrl, true);
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

    .action-row {
      height: 56px;
      margin: 0 16px;
      padding: 8px 0 24px 0;

      a {
        display: inline-flex;
        align-items: center;

        @extend %face-sans-14-medium;

        color: $color-green;

        svg {
          width: 24px;
          height: 24px;
          margin-right: 4px;
          opacity: 0.44;
          color: $color-white;
        }

        &:hover {
          color: $color-green-hover;

          svg {
            opacity: 1;

            path {
              color: $color-green;
            }
          }
        }

        &:active {
          opacity: 0.7;

          svg {
            opacity: 0.7;

            path {
              color: $color-green;
            }
          }
        }
      }
    }
  }
}
</style>
