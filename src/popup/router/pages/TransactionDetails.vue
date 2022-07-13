<template>
  <div class="transaction-details">
    <AnimatedSpinner
      v-if="!transaction || transaction.incomplete"
      class="spinner"
    />
    <template v-else>
      <Plate
        v-if="!isAllowance || hasError"
        class="header"
      >
        <TransactionRevertedStatus
          v-if="hasError"
          :return-type="transaction.tx.returnType"
        />
        <template v-if="!isAllowance">
          <TransactionTokenRow
            v-for="token in tokenList"
            :key="token.symbol"
            :token="token"
            :direction="token.isReceived ? 'received' : 'sent'"
            :has-error="hasError"
          />
        </template>
      </Plate>
      <div class="content">
        <TransactionOverview
          v-bind="transaction"
          :is-dex="isDex"
        />
        <div class="data-grid">
          <template v-if="isSwap">
            <SwapRates :transaction="transaction" />
            <SwapRoute :transaction="transaction" />
          </template>
          <TransactionDetailsPoolTokens
            v-if="(isPool || isAllowance) && tokenList"
            :tokens="tokenList"
            :tx-function="transaction.tx.function"
            :is-allowance="isAllowance"
          />
          <DetailsItem
            v-if="hasError"
            :label="$t('pages.transactionDetails.reason')"
            :value="transaction.tx.return"
            class="reason"
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
            :label="$t('pages.transactionDetails.amount')"
            data-cy="amount"
          >
            <TokenAmount
              slot="value"
              :amount="amount"
              :symbol="symbol"
              fiat-below
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
              fiat-below
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
              fiat-below
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
import { mapActions, mapGetters, mapState } from 'vuex';
import { camelCase } from 'lodash-es';
import { formatDate, formatTime } from '../../utils';
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
import TransactionTokenRow from '../components/TransactionTokenRow.vue';
import CopyAddress from '../components/CopyAddress.vue';
import { aettosToAe } from '../../utils/helper';
import * as transactionTokenInfoResolvers from '../../utils/transactionTokenInfoResolvers';
import TransactionDetailsPoolTokens from '../components/TransactionDetailsPoolTokens.vue';
import TransactionRevertedStatus from '../components/TransactionRevertedStatus.vue';
import { FUNCTION_TYPE_DEX } from '../../utils/constants';

export default {
  name: 'TransactionDetails',
  components: {
    TransactionRevertedStatus,
    TransactionDetailsPoolTokens,
    TransactionTokenRow,
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
  props: {
    hash: { type: String, required: true },
  },
  data() {
    return {
      transaction: null,
      tokenList: null,
    };
  },
  computed: {
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapGetters([
      'getTx',
      'getTxSymbol',
      'getTxAmountTotal',
      'getTxDirection',
      'getTxTipUrl',
      'getExplorerPath',
      'isTxAex9',
      'getDexContracts',
    ]),
    amount() {
      return this.getTxAmountTotal(this.transaction);
    },
    symbol() {
      return this.getTxSymbol(this.transaction);
    },
    tipUrl() {
      return this.getTxTipUrl(this.transaction);
    },
    singleToken() {
      return {
        isReceived: this.getTxDirection(this.transaction) === 'received',
        amount: this.getTxAmountTotal(this.transaction),
        symbol: this.getTxSymbol(this.transaction),
        isAex9: this.isTxAex9(this.transaction),
        preventAmountConversion: true,
        showFiat: true,
      };
    },
    isDex() {
      return this.getDexContracts.router.includes(this.transaction?.tx?.contractId)
        || this.getDexContracts.wae.includes(this.transaction?.tx?.contractId)
        || this.isAllowance;
    },
    isSwap() {
      return FUNCTION_TYPE_DEX.swap.includes(this.transaction?.tx?.function);
    },
    isPool() {
      return FUNCTION_TYPE_DEX.pool.includes(this.transaction?.tx?.function);
    },
    isAllowance() {
      return FUNCTION_TYPE_DEX.allowance.includes(this.transaction?.tx?.function);
    },
    hasError() {
      return this.transaction?.tx.result === 'abort';
    },
  },
  async mounted() {
    this.transaction = this.getTx(this.hash);
    if (!this.transaction || this.transaction?.incomplete) {
      await this.$watchUntilTruly(() => this.$store.state.middleware);
      await this.$watchUntilTruly(() => this.$store.state.sdk);
      this.transaction = await this.$store.state.middleware.getTxByHash(this.hash);
    }
    Promise.all(this.tokens().map(
      async (token) => ({ ...token, tokens: await this.prepareTokenPair(token) }),
    )).then((values) => {
      this.tokenList = values;
    });
  },
  methods: {
    ...mapActions('fungibleTokens', ['getContractTokenPairs']),
    aettosToAe,
    prepareTokenPair(token) {
      if (!token.isPool || !token.contractId) return [token];
      return this.getContractTokenPairs(token.contractId);
    },
    tokens() {
      if (!this.isDex) return [this.singleToken];
      const resolver = transactionTokenInfoResolvers[camelCase(this.transaction?.tx?.function)];
      if (!resolver) return null;
      const tokens = resolver(this.transaction, this.availableTokens);

      return this.isPool ? tokens?.tokens.reverse() : tokens?.tokens;
    },
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

  .span-3-columns {
    @include mixins.flex(flex-start, flex-start);

    column-gap: 24px;
  }

  .content {
    background: variables.$color-bg-3;

    .transaction-overview {
      padding: 16px;
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
