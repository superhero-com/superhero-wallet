<template>
  <Modal
    full-screen
    class="confirm-transaction-sign"
    data-cy="popup-aex2"
    absolute-footer
  >
    <TransactionOverview :tx="completeTransaction" />
    <AnimatedSpinner
      v-if="loading"
      class="loader"
    />
    <template v-if="(isDex || isAllowance) && tokenList">
      <TransactionDetailsPoolTokenRow
        v-for="(token, idx) in tokenList"
        :key="token.contractId"
        :token="token"
        :tokens="token.tokens"
        :label="getLabels(token, idx)"
        :hide-amount="isSwap"
      />
    </template>
    <DetailsItem
      v-if="getNameFee(transaction)"
      :label="$t('modals.confirm-transaction-sign.nameFee')"
      class="name-fee"
    >
      <TokenAmount
        slot="value"
        :amount="getNameFee(transaction)"
      />
    </DetailsItem>

    <div class="details">
      <DetailsItem
        v-if="isSwap"
        :label="$t(`pages.signTransaction.${swapDirection}`)"
      >
        <TokenAmount
          slot="value"
          :amount="+convertToken(getSwapTokenAmountData.amount, -getSwapTokenAmountData.decimals)"
          :symbol="getSwapTokenAmountData.isAe ? 'AE' : getSwapTokenAmountData.symbol"
          :aex9="isTxAex9(transaction)"
          :hide-fiat="!getSwapTokenAmountData.isAe"
          data-cy="total"
        />
      </DetailsItem>
      <DetailsItem :label="$t('pages.signTransaction.fee')">
        <TokenAmount
          slot="value"
          :amount="getTxFee(transaction)"
          data-cy="fee"
        />
      </DetailsItem>
      <DetailsItem
        v-if="!isDex"
        :label="$t('pages.signTransaction.total')"
      >
        <TokenAmount
          slot="value"
          :amount="getTxAmountTotal(transaction)"
          :symbol="getTxSymbol(transaction)"
          :aex9="isTxAex9(transaction)"
          data-cy="total"
        />
      </DetailsItem>
    </div>

    <ButtonPlain
      class="show-advanced"
      :class="{ active: showAdvanced }"
      @click="showAdvanced = !showAdvanced"
    >
      {{ $t('pages.signTransaction.advanced') }}
      <Arrow class="icon" />
    </ButtonPlain>

    <transition name="fade">
      <div
        v-if="showAdvanced && transaction"
        class="advanced"
      >
        <DetailsItem
          v-for="field in filteredTxFields"
          :key="field"
          :label="$t('modals.confirm-transaction-sign')[field]"
          :value="transaction[field]"
          :class="{ 'hash-field': isHash(field) }"
        />
      </div>
    </transition>
    <template
      slot="footer"
    >
      <Button
        third
        fill="secondary"
        data-cy="deny"
        @click="cancel()"
      >
        {{ $t('pages.signTransaction.reject') }}
      </Button>
      <Button
        third
        data-cy="accept"
        @click="resolve()"
      >
        {{ $t('pages.signTransaction.confirm') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { camelCase } from 'lodash-es';
import Modal from '../Modal.vue';
import Button from '../Button.vue';
import ButtonPlain from '../ButtonPlain.vue';
import TransactionOverview from '../TransactionOverview.vue';
import DetailsItem from '../DetailsItem.vue';
import TokenAmount from '../TokenAmount.vue';
import TransactionDetailsPoolTokenRow from '../TransactionDetailsPoolTokenRow.vue';
import AnimatedSpinner from '../../../../icons/animated-spinner.svg?skip-optimize';
import Arrow from '../../../../icons/arrow.svg?vue-component';
import { FUNCTION_TYPE_DEX } from '../../../utils/constants';
import * as transactionTokenInfoResolvers from '../../../utils/transactionTokenInfoResolvers';
import { getDexTransactionTag } from '../../../utils';
import mixin from '../../pages/Popups/mixin';
import { convertToken } from '../../../utils/helper';

export default {
  components: {
    Modal,
    Button,
    ButtonPlain,
    TransactionOverview,
    DetailsItem,
    TokenAmount,
    Arrow,
    TransactionDetailsPoolTokenRow,
    AnimatedSpinner,
  },
  mixins: [mixin],
  props: {
    transaction: { type: Object, required: true },
  },
  data: () => ({
    showAdvanced: false,
    tokenList: null,
    txFunction: null,
    loading: false,
    TX_FIELDS: [
      'nonce',
      'payload',
      'recipientId',
      'code',
      'callData',
      'contractId',
      'commitmentId',
      'name',
      'nameFee',
      'nameSalt',
      'nameId',
      'pointers',
    ],
  }),
  computed: {
    ...mapState(['sdk']),
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapGetters(['formatCurrency', 'account', 'activeNetwork']),
    ...mapGetters([
      'getTxSymbol',
      'getTxAmountTotal',
      'getTxFee',
      'getNameFee',
      'isTxAex9',
      'getDexContracts',
      'getTxDirection',
    ]),
    isAllowance() {
      return FUNCTION_TYPE_DEX.allowance.includes(this.txFunction);
    },
    isSwap() {
      return FUNCTION_TYPE_DEX.swap.includes(this.txFunction);
    },
    isPool() {
      return FUNCTION_TYPE_DEX.pool.includes(this.txFunction);
    },
    isDex() {
      return this.getDexContracts.router.includes(this.transaction?.contractId)
        || this.getDexContracts.wae.includes(this.transaction?.contractId)
        || this.isAllowance;
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
    filteredTxFields() {
      return this.TX_FIELDS.filter((field) => !!this.transaction[field]);
    },
    swapDirection() {
      if (['swap_tokens_for_exact_tokens', 'swap_tokens_for_exact_ae', 'swap_ae_for_exact_tokens'].includes(this.txFunction)) return 'maxSpent';
      if (['swap_exact_tokens_for_tokens', 'swap_exact_ae_for_tokens', 'swap_exact_tokens_for_ae'].includes(this.txFunction)) return 'minReceived';
      return 'total';
    },
    getSwapTokenAmountData() {
      return this.swapDirection === 'maxSpent' ? this.tokenList[0] : this.tokenList[1];
    },
    completeTransaction() {
      return { ...this.transaction, function: this.txFunction };
    },
    isProvideLiquidity() {
      return getDexTransactionTag[this.txFunction] === 'provide_liquidity';
    },
  },
  async mounted() {
    if (this.transaction.contractId) {
      try {
        this.loading = true;
        setTimeout(() => { this.loading = false; }, 20000);
        await this.$watchUntilTruly(() => this.sdk);
        const { bytecode } = await this.sdk.getContractByteCode(this.transaction.contractId);
        const txParams = await this.sdk.compilerApi.decodeCalldataBytecode({
          bytecode,
          calldata: this.transaction.callData,
        });
        this.txFunction = txParams.function;
        const allTokens = this.getTokens(txParams);

        this.tokenList = allTokens.map((token) => ({
          ...token,
          tokens: token.isPool && !this.isProvideLiquidity
            ? allTokens.filter((t) => !t.isPool).reverse()
            : [token],
        }));
      } catch (e) {
        this.tokenList = null;
        this.txFunction = null;
      } finally {
        this.loading = false;
      }
    }
  },
  methods: {
    convertToken,
    getTokens(txParams) {
      if (!this.isDex) return [this.singleToken];
      const resolver = transactionTokenInfoResolvers[camelCase(txParams.function)];
      if (!resolver) return [];
      const tokens = resolver(
        { tx: { ...txParams, ...this.transaction } }, this.availableTokens,
      )?.tokens;
      if (!this.isPool) return tokens;
      if (this.isProvideLiquidity) return tokens.filter((t) => !t.isPool);
      return tokens.reverse();
    },
    isHash(field) {
      return ['callData', 'contractId'].includes(field);
    },
    getLabels(token, idx) {
      if (this.isAllowance) {
        return this.$t('pages.signTransaction.approveUseOfToken');
      }
      if (this.isSwap) {
        return !idx ? this.$t('pages.signTransaction.from') : this.$t('pages.signTransaction.to');
      }
      if (this.isPool && this.isProvideLiquidity) {
        return token.isPool ? '' : this.$t('pages.signTransaction.maximumDeposited');
      }
      if (this.isPool && getDexTransactionTag[this.txFunction] === 'remove_liquidity') {
        return token.isPool ? this.$t('pages.signTransaction.poolTokenSpent') : this.$t('pages.signTransaction.minimumWithdrawn');
      }
      return '';
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../../styles/variables';
@import '../../../../styles/typography';
@import '../../../../styles/mixins';

.confirm-transaction-sign {
  .loader {
    display: flex;
    margin: 0 auto;
    width: 56px;
    height: 56px;
  }

  .transaction-overview {
    padding-bottom: 16px;
  }

  .details {
    @include flex(flex-start, flex-start, column);

    gap: 8px;
    padding: 8px 0;

    .details-item {
      margin-right: 24px;
    }
  }

  .show-advanced {
    display: flex;
    align-items: center;
    padding-top: 8px;
    margin-bottom: 8px;
    background: $color-bg-1;
    width: 100%;

    @extend %face-sans-15-medium;

    color: $color-dark-grey;

    .icon {
      width: 16px;
      height: 16px;
      color: $color-dark-grey;
      opacity: 0.7;
      margin-left: 8px;
    }

    &:hover {
      color: $color-light-grey;

      .icon {
        opacity: 1;
      }
    }

    &.active .icon {
      transform: rotateX(180deg);
    }
  }

  .advanced {
    padding: 16px 16px 8px;
    background: $color-border;
    border: 1px solid $color-border-hover;
    border-radius: 6px;

    .details-item::v-deep {
      .value {
        color: $color-light-grey;
        line-height: 24px;
        letter-spacing: 0.05em;
        margin-bottom: 12px;

        @extend %face-sans-14-regular;
      }

      &.hash-field {
        .value {
          @extend %face-sans-12-regular;

          line-height: 20px;
        }
      }
    }
  }

  ::v-deep .container {
    background: $color-bg-1;

    .body {
      overflow-y: scroll;
      text-align: left;
      padding: 16px 16px 0;
      border-radius: 0 0 10px 10px;
    }

    .footer {
      background:
        linear-gradient(
          180deg,
          rgba(19, 19, 19, 0) 0%,
          rgba(19, 19, 19, 0.65) 28.13%,
          rgba(19, 19, 19, 0.7) 33.33%
        );
      z-index: 1;
    }
  }

  .pool-token-row::v-deep {
    padding-bottom: 8px;
  }
}
</style>
