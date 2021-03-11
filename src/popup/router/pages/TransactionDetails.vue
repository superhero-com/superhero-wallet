<template>
  <div class="transaction-details">
    <div class="header">
      <TokenAmount :amount="amount" :symbol="symbol" :direction="direction" large />
    </div>

    <div class="content">
      <div class="visual-overview"><!-- TODO --></div>

      <div class="data-grid">
        <div class="data-item span-2-columns" v-if="tipUrl">
          <span class="label">
            {{ $t('pages.transactionDetails.tipUrl') }}
            <CopyButton :value="tipUrl" message="URL copied" />
          </span>
          <div class="value">
            <a @click="openTipUrl">{{ tipUrl }}</a>
          </div>
        </div>

        <div class="data-item span-2-columns">
          <span class="label">
            {{ $t('pages.transactionDetails.hash') }}
            <CopyButton :value="hash" message="Hash copied" />
          </span>
          <div class="value small">{{ hash }}</div>
        </div>

        <div class="data-item">
          <span class="label">{{ $t('pages.transactionDetails.timestamp') }}</span>
          <div class="value">
            {{ microTime | formatDate }}
            <span class="secondary">{{ microTime | formatTime }}</span>
          </div>
        </div>

        <div class="data-item" v-if="blockHeight">
          <span class="label">{{ $t('pages.transactionDetails.blockHeight') }}</span>
          <span class="value">{{ blockHeight }}</span>
        </div>

        <div class="data-item" v-if="tx.gas">
          <span class="label">{{ $t('pages.transactionDetails.gas') }}</span>
          <span class="value">{{ tx.gas }}</span>
        </div>

        <div class="data-item" v-if="tx.gasPrice">
          <span class="label">{{ $t('pages.transactionDetails.gasPrice') }}</span>
          <div class="value">
            <TokenAmount :amount="tx.gasPrice" symbol="ættos" hideFiat />
          </div>
        </div>

        <div class="data-item">
          <span class="label">{{ $t('pages.transactionDetails.amount') }}</span>
          <div class="value">
            <TokenAmount :amount="amount" :symbol="symbol" hideFiat />
          </div>
        </div>

        <div class="data-item" v-if="tx.nonce">
          <span class="label">{{ $t('pages.transactionDetails.nonce') }}</span>
          <span class="value">{{ tx.nonce }}</span>
        </div>

        <div class="data-item" v-if="pending">
          <span class="label">{{ $t('pages.transactionDetails.status') }}</span>
          <span class="value highlight">{{ $t('pages.transactionDetails.pending') }}</span>
        </div>

        <div class="data-item span-2-columns" v-if="tx.fee">
          <span class="label">{{ $t('pages.transactionDetails.fee') }}</span>
          <div class="value">
            <TokenAmount :amount="tx.fee" symbol="ættos" hideFiat />
          </div>
        </div>
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
import CopyButton from '../components/CopyButton';
import AnimatedPending from '../../../icons/animated-pending.svg?vue-component';
import BlockIcon from '../../../icons/block.svg?vue-component';

export default {
  name: 'TransactionDetails',
  components: { TokenAmount, CopyButton, AnimatedPending, BlockIcon },
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

    .data-item {
      .label {
        margin-bottom: 8px;
        display: flex;
        align-items: center;

        @extend %face-sans-15-medium;

        line-height: 16px;
        color: $color-dark-grey;
      }

      .value {
        @extend %face-sans-14-regular;

        color: $color-white;
        line-height: 24px;
        margin-bottom: 8px;

        .secondary {
          color: $color-light-grey;
          margin-left: 4px;
        }

        &.small {
          @extend %face-sans-11-regular;
        }

        &.highlight {
          color: $color-error;
        }

        a {
          color: $color-green;

          &:hover {
            color: $color-green-hover;
          }

          &:active {
            opacity: 0.7;
          }
        }
      }

      .copy-button {
        margin-left: 8px;
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
