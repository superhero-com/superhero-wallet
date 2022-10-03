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
      <template #value>
        <TokenAmount
          :amount="getNameFee(transaction)"
        />
      </template>
    </DetailsItem>

    <div class="details">
      <DetailsItem
        v-if="isSwap"
        :label="$t(`pages.signTransaction.${swapDirection}`)"
      >
        <template #value>
          <TokenAmount
            :amount="+convertToken(getSwapTokenAmountData.amount, -getSwapTokenAmountData.decimals)"
            :symbol="getSwapTokenAmountData.isAe ? 'AE' : getSwapTokenAmountData.symbol"
            :aex9="isTxAex9(transaction)"
            :hide-fiat="!getSwapTokenAmountData.isAe"
            data-cy="total"
          />
        </template>
      </DetailsItem>
      <DetailsItem :label="$t('pages.signTransaction.fee')">
        <template #value>
          <TokenAmount
            :amount="getTxFee(transaction)"
            data-cy="fee"
          />
        </template>
      </DetailsItem>
      <DetailsItem
        v-if="!isDex"
        :label="$t('pages.signTransaction.total')"
      >
        <template #value>
          <TokenAmount
            :amount="getTxAmountTotal(transaction)"
            :symbol="getTxSymbol(transaction)"
            :aex9="isTxAex9(transaction)"
            data-cy="total"
          />
        </template>
      </DetailsItem>
    </div>

    <BtnPlain
      class="show-advanced"
      :class="{ active: showAdvanced }"
      @click="showAdvanced = !showAdvanced"
    >
      {{ $t('pages.signTransaction.advanced') }}
      <Arrow class="icon" />
    </BtnPlain>

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

    <template #footer>
      <BtnMain
        third
        variant="secondary"
        data-cy="deny"
        @click="cancel()"
      >
        {{ $t('pages.signTransaction.reject') }}
      </BtnMain>
      <BtnMain
        third
        data-cy="accept"
        @click="resolve()"
      >
        {{ $t('pages.signTransaction.confirm') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { camelCase } from 'lodash-es';
import {
  FUNCTION_TYPE_DEX,
  DEX_TRANSACTION_TAGS,
  DEX_PROVIDE_LIQUIDITY,
  DEX_REMOVE_LIQUIDITY,
  convertToken,
  watchUntilTruthy,
} from '../../utils';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import BtnPlain from '../buttons/BtnPlain.vue';
import TransactionOverview from '../TransactionOverview.vue';
import DetailsItem from '../DetailsItem.vue';
import TokenAmount from '../TokenAmount.vue';
import TransactionDetailsPoolTokenRow from '../TransactionDetailsPoolTokenRow.vue';
import AnimatedSpinner from '../../../icons/animated-spinner.svg?skip-optimize';
import Arrow from '../../../icons/arrow.svg?vue-component';
import * as transactionTokenInfoResolvers from '../../utils/transactionTokenInfoResolvers';
import mixin from '../../pages/Popups/mixin';

export default {
  components: {
    Modal,
    BtnMain,
    BtnPlain,
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
      return DEX_TRANSACTION_TAGS[this.txFunction] === DEX_PROVIDE_LIQUIDITY;
    },
  },
  async mounted() {
    if (this.transaction.contractId) {
      try {
        this.loading = true;
        setTimeout(() => { this.loading = false; }, 20000);
        await watchUntilTruthy(() => this.sdk);
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
      if (this.isPool && DEX_TRANSACTION_TAGS[this.txFunction] === DEX_REMOVE_LIQUIDITY) {
        return token.isPool
          ? this.$t('pages.signTransaction.poolTokenSpent')
          : this.$t('pages.signTransaction.minimumWithdrawn');
      }
      return '';
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

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
    @include mixins.flex(flex-start, flex-start, column);

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
    background: variables.$color-bg-1;
    width: 100%;

    @extend %face-sans-15-medium;

    color: variables.$color-grey-dark;

    .icon {
      width: 16px;
      height: 16px;
      color: variables.$color-grey-dark;
      opacity: 0.7;
      margin-left: 8px;
    }

    &:hover {
      color: variables.$color-light-grey;

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
    background: variables.$color-border;
    border: 1px solid variables.$color-border-hover;
    border-radius: 6px;

    .details-item::v-deep {
      .value {
        color: variables.$color-light-grey;
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

  .pool-token-row::v-deep {
    padding-bottom: 8px;
  }
}
</style>
