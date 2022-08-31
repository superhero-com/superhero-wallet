<template>
  <div class="transaction-details">
    <AnimatedSpinner
      v-if="!transaction || transaction.incomplete"
      class="spinner"
    />
    <template v-else>
      <Plate
        v-if="!isAllowance || isErrorTransaction"
        class="header"
      >
        <TransactionErrorStatus
          v-if="isErrorTransaction"
          :return-type="transaction.tx.returnType"
        />
        <TransactionTokens
          :tokens="tokens"
          :error="isErrorTransaction"
          :class="{ reverse: isPool }"
        />
      </Plate>
      <div class="content">
        <TransactionOverview v-bind="transaction" />
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
          />
          <TransactionDetailsPoolTokens
            v-if="(isPool || isAllowance) && tokens"
            :tokens="tokens"
            :tx-function="transaction.tx.function"
            :is-allowance="isAllowance"
            :class="{ reverse: isPool }"
          />
          <DetailsItem
            v-if="tipUrl"
            :label="$t('pages.transactionDetails.tipUrl')"
            class="tip-url"
            data-cy="tip-url"
          >
            <CopyButton
              slot="label"
              :value="tipUrl"
              :message="$t('pages.transactionDetails.urlCopied')"
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
            :label="$t('pages.transactionDetails.hash')"
            data-cy="hash"
            small
          >
            <CopyAddress
              slot="value"
              class="copy-hash"
              :value="hash"
              :custom-text="$t('hashCopied')"
            />
          </DetailsItem>
          <div class="span-3-columns">
            <DetailsItem
              v-if="transaction.microTime && !transaction.pending"
              :value="transaction.microTime | formatDate"
              :secondary="transaction.microTime | formatTime"
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
                {{ $t('pages.transactionDetails.pending') }}...
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
            v-if="!(isDex || isAllowance)"
            :label="$t('pages.transactionDetails.amount')"
            data-cy="amount"
          >
            <TokenAmount
              slot="value"
              :amount="getTxAmountTotal(transaction)"
              :symbol="getTxSymbol(transaction)"
              :hide-fiat="getTxSymbol(transaction) !== 'AE'"
            />
          </DetailsItem>
          <DetailsItem
            v-if="transaction.tx.gasPrice"
            :label="$t('pages.transactionDetails.gasPrice')"
            data-cy="gas-price"
          >
            <TokenAmount
              slot="value"
              :amount="+aettosToAe(transaction.tx.gasPrice)"
              symbol="AE"
              hide-fiat
            />
          </DetailsItem>
          <DetailsItem
            v-if="transaction.tx.gasUsed"
            :value="transaction.tx.gasUsed"
            :label="$t('pages.transactionDetails.gasUsed')"
            data-cy="gas"
          />
          <DetailsItem
            v-if="transaction.tx.fee"
            :label="$t('pages.transactionDetails.fee')"
            data-cy="fee"
          >
            <TokenAmount
              slot="value"
              :amount="+aettosToAe(transaction.tx.fee)"
              symbol="AE"
            />
          </DetailsItem>
        </div>
        <div class="explorer">
          <LinkButton :to="getExplorerPath(hash)">
            {{ $t('pages.transactionDetails.explorer') }}
            <ExternalLink />
          </LinkButton>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { formatDate, formatTime } from '../../utils';
import transactionTokensMixin from '../../../mixins/transactionTokensMixin';
import TransactionOverview from '../components/TransactionOverview.vue';
import Plate from '../components/Plate.vue';
import SwapRoute from '../components/SwapRoute.vue';
import SwapRates from '../components/SwapRates.vue';
import TokenAmount from '../components/TokenAmount.vue';
import DetailsItem from '../components/DetailsItem.vue';
import LinkButton from '../components/LinkButton.vue';
import CopyButton from '../components/CopyButton.vue';
import Truncate from '../components/Truncate.vue';
import AnimatedPending from '../../../icons/animated-pending.svg?vue-component';
import AnimatedSpinner from '../../../icons/animated-spinner.svg?skip-optimize';
import ExternalLink from '../../../icons/external-link.svg?vue-component';
import TransactionTokens from '../components/TransactionTokenRows.vue';
import CopyAddress from '../components/CopyAddress.vue';
import { aettosToAe } from '../../utils/helper';
import TransactionDetailsPoolTokens from '../components/TransactionDetailsPoolTokens.vue';
import TransactionErrorStatus from '../components/TransactionErrorStatus.vue';
import { FUNCTION_TYPE_DEX } from '../../utils/constants';

export default {
  components: {
    TransactionErrorStatus,
    TransactionDetailsPoolTokens,
    TransactionTokens,
    TransactionOverview,
    Plate,
    TokenAmount,
    DetailsItem,
    LinkButton,
    CopyButton,
    Truncate,
    AnimatedPending,
    AnimatedSpinner,
    ExternalLink,
    CopyAddress,
    SwapRoute,
    SwapRates,
  },
  filters: {
    formatDate,
    formatTime,
  },
  mixins: [transactionTokensMixin],
  props: {
    hash: { type: String, required: true },
  },
  data: () => ({
    transaction: null,
    showDetailedAllowanceInfo: true,
  }),
  computed: {
    ...mapGetters(['getTx', 'getTxSymbol', 'getTxAmountTotal', 'getTxTipUrl', 'getExplorerPath']),
    tipUrl() {
      return this.getTxTipUrl(this.transaction);
    },
    isSwap() {
      return FUNCTION_TYPE_DEX.swap.includes(this.transaction?.tx?.function);
    },
    isPool() {
      return FUNCTION_TYPE_DEX.pool.includes(this.transaction?.tx?.function);
    },
  },
  async mounted() {
    this.transaction = this.getTx(this.hash);
    if (!this.transaction || this.transaction?.incomplete) {
      await this.$watchUntilTruly(() => this.$store.state.middleware);
      this.transaction = await this.$store.state.middleware.getTxByHash(this.hash);
      this.$store.commit('setTransactionByHash', this.transaction);
    }
  },
  methods: {
    aettosToAe,
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

    .transaction-token-rows {
      &.reverse {
        display: flex;
        flex-direction: column-reverse;
      }

      ::v-deep .token-row {
        margin-bottom: 12px;
        padding-inline: 16px;

        .amount {
          @extend %face-sans-18-regular;
        }

        .tokens {
          @extend %face-sans-18-medium;

          color: variables.$color-white;
        }
      }
    }
  }

  .span-3-columns {
    @include mixins.flex(flex-start, flex-start);

    column-gap: 24px;
  }

  .content {
    background: variables.$color-bg-3;

    .transaction-overview {
      padding: 16px;
    }

    .pool-tokens.reverse {
      flex-direction: column-reverse;
    }

    .data-grid {
      @include mixins.flex(flex-start, flex-start, column);

      column-gap: 24px;
      row-gap: 16px;
      padding: 8px 16px;

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
      padding: 8px 0 32px 0;

      .link-button {
        @extend %face-sans-14-medium;

        text-decoration: none;

        svg {
          opacity: 1;
          color: variables.$color-green;
        }

        &:hover {
          color: variables.$color-green;
          text-decoration: underline;
        }
      }
    }
  }

  .details-item::v-deep {
    .label {
      white-space: nowrap;
    }
  }

  .copy-hash::v-deep {
    .copied {
      align-items: center;

      .text {
        flex: 0;
        margin-inline: 8px;
        word-spacing: 100vw;
        justify-content: center;
      }
    }
  }

  .reason::v-deep {
    .value {
      color: variables.$color-warning;
    }
  }
}
</style>
