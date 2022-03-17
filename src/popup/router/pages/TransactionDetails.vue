<template>
  <div class="transaction-details">
    <AnimatedSpinner
      v-if="!transaction"
      class="spinner"
    />

    <Plate
      v-if="transaction"
      class="header"
    >
      <TokenAmount
        :amount="amount"
        :symbol="symbol"
        :direction="direction"
        :aex9="isTxAex9(transaction)"
        large
      />
    </Plate>
    <div
      v-if="transaction"
      class="content"
    >
      <TransactionOverview v-bind="transaction" />
      <div class="data-grid">
        <DetailsItem
          v-if="tipUrl"
          :label="$t('pages.transactionDetails.tipUrl')"
          class="tip-url span-2-columns"
          data-cy="tip-url"
        >
          <CopyButton
            slot="label"
            :value="tipUrl"
            message="URL copied"
          />
          <LinkButton
            slot="value"
            :to="/^http[s]*:\/\//.test(tipUrl) ? tipUrl : `http://${tipUrl}`"
          >
            <Truncate
              :str="tipUrl"
              fixed
            />
          </LinkButton>
        </DetailsItem>
        <DetailsItem
          :value="hash"
          :label="$t('pages.transactionDetails.hash')"
          class="span-2-columns"
          data-cy="hash"
          small
        >
          <CopyButton
            slot="label"
            :value="hash"
            message="Hash copied"
          />
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
          <TokenAmount
            slot="value"
            :amount="transaction.tx.gasPrice"
            symbol="ættos"
            hide-fiat
          />
        </DetailsItem>
        <DetailsItem
          :label="$t('pages.transactionDetails.amount')"
          data-cy="amount"
        >
          <TokenAmount
            slot="value"
            :amount="amount"
            :symbol="symbol"
            hide-fiat
          />
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
          <TokenAmount
            slot="value"
            :amount="transaction.tx.fee"
            symbol="ættos"
            hide-fiat
          />
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
import TransactionOverview from '../components/TransactionOverview.vue';
import Plate from '../components/Plate.vue';
import TokenAmount from '../components/TokenAmount.vue';
import DetailsItem from '../components/DetailsItem.vue';
import LinkButton from '../components/LinkButton.vue';
import CopyButton from '../components/CopyButton.vue';
import Truncate from '../components/Truncate.vue';
import AnimatedPending from '../../../icons/animated-pending.svg?vue-component';
import AnimatedSpinner from '../../../icons/animated-spinner.svg?skip-optimize';
import BlockIcon from '../../../icons/block.svg?vue-component';

export default {
  name: 'TransactionDetails',
  components: {
    TransactionOverview,
    Plate,
    TokenAmount,
    DetailsItem,
    LinkButton,
    CopyButton,
    Truncate,
    AnimatedPending,
    AnimatedSpinner,
    BlockIcon,
  },
  filters: {
    formatDate,
    formatTime,
  },
  props: {
    hash: { type: String, required: true },
  },
  data() {
    return {
      transaction: null,
    };
  },
  computed: {
    ...mapGetters([
      'getTx',
      'getTxSymbol',
      'getTxAmountTotal',
      'getTxDirection',
      'getTxTipUrl',
      'getExplorerPath',
      'isTxAex9',
    ]),
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
  async mounted() {
    this.transaction = this.getTx(this.hash);
    if (!this.transaction) {
      await this.$watchUntilTruly(() => this.$store.state.middleware);
      this.transaction = await this.$store.state.middleware.getTxByHash(this.hash);
    }
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.transaction-details {
  display: flex;
  flex-direction: column;

  .spinner {
    align-self: center;
    width: 56px;
    height: 56px;
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .header {
    display: flex;
    justify-content: center;
    height: 92px;

    @include mixins.mobile {
      width: 100%;
    }

    .token-amount {
      text-align: center;
      margin: 16px 0 24px 0;

      ::v-deep .fiat {
        display: block;
        padding-top: 4px;
      }
    }
  }

  .content {
    margin-top: -10px;
    background: variables.$color-bg-3;

    .transaction-overview {
      padding: 26px 16px 16px 16px;
    }

    .data-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-auto-rows: 64px;
      row-gap: 8px;
      column-gap: 24px;
      padding: 8px 16px;

      .span-2-columns {
        grid-column-end: span 2;
      }

      .tip-url {
        width: 100%;

        .link-button {
          display: block;
        }
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
