<template>
  <div
    v-if="tokens.length > 1"
    class="swap-route"
  >
    <div class="title">
      {{ $t('pages.transactionDetails.swapRoute') }}
    </div>
    <div class="swap-wrapper">
      <span
        v-for="(token, idx) of tokens"
        :key="idx"
        class="swap"
      >
        <span
          v-if="idx"
          class="divider"
        >
          <span class="space" />
          {{ checkWaeAeTx(idx - 1)
            ? 0 : `${(idx > 1 && checkWaeAeTx(idx - 2)) || idx === 1 ? '' : '<'}0.3` }}%
          {{ $t('pages.transactionDetails.poolFee') }}
          <span class="arrow">
            <ArrowHead />
          </span>
        </span>
        <Tokens :tokens="[token]" />
      </span>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { camelCase } from 'lodash-es';
import Tokens from './Tokens.vue';
import * as transactionTokenInfoResolvers from '../../utils/transactionTokenInfoResolvers';
import { DEX_CONTRACTS, FUNCTION_TYPE_DEX } from '../../utils/constants';
import ArrowHead from '../../../icons/arrow-head.svg?vue-component';

export default {
  components: {
    Tokens,
    ArrowHead,
  },
  props: {
    transaction: { type: Object, required: true },
  },
  computed: {
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapGetters(['activeNetwork']),
    tokens() {
      if (!FUNCTION_TYPE_DEX.swap.includes(this.transaction.tx.function)) return [];
      if (!transactionTokenInfoResolvers[camelCase(this.transaction.tx.function)]) return [];
      let { tokens } = transactionTokenInfoResolvers[camelCase(this.transaction.tx.function)](
        this.transaction, this.availableTokens,
      );
      const index = this.transaction.tx.arguments.findIndex(({ type }) => type === 'list');
      if (index >= 0 && this.transaction.tx.arguments[index].value.length > tokens.length) {
        tokens = [
          tokens[0],
          ...this.transaction.tx.arguments[index].value
            .slice(1, this.transaction.tx.arguments[index].value.length - 1)
            .map(({ value }) => this.availableTokens[value]),
          tokens[1],
        ];
      }
      const waeContract = DEX_CONTRACTS[this.activeNetwork.networkId]?.wae;
      if (tokens[0].isAe && waeContract && !waeContract?.includes(tokens[1].contractId)) {
        tokens.unshift({
          ...tokens[0],
          isAe: true,
        });
        tokens[1].isAe = false;
      }
      if (tokens[tokens.length - 1].isAe && waeContract
        && !waeContract?.includes(tokens[tokens.length - 2].contractId)) {
        tokens[tokens.length - 1].isAe = false;
        tokens.push({ ...tokens[tokens.length - 1], isAe: true });
      }
      return tokens;
    },
  },
  methods: {
    checkWaeAeTx(idx) {
      if (idx === this.tokens.length - 1) return false;
      const contracts = DEX_CONTRACTS[this.activeNetwork.networkId];
      return (contracts?.wae?.includes(this.tokens[idx].contractId)
        && this.tokens[idx + 1].isAe)
        || (contracts?.wae?.includes(this.tokens[idx + 1].contractId)
        && this.tokens[idx].isAe);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.swap-route {
  width: 100%;
  overflow: hidden;

  .title {
    color: variables.$color-dark-grey;
    padding-bottom: 8px;

    @extend %face-sans-14-medium;
  }

  .swap-wrapper {
    @include mixins.flex(flex-start, flex-start, row);

    flex-wrap: wrap;
    row-gap: 4px;

    :last-of-type {
      flex: 1;

      .tokens::v-deep {
        width: 100%;
      }
    }
  }

  .swap {
    @include mixins.flex(flex-start, center, row);

    flex: 0;
    position: relative;

    .tokens::v-deep {
      @extend %face-sans-15-medium;
    }

    .divider,
    .tokens::v-deep {
      background: variables.$color-bg-3;
      z-index: 1;
      padding-right: 4px;
    }

    &::before {
      content: "";
      background-image: linear-gradient(variables.$color-blue 2px, transparent 1px);
      position: absolute;
      top: calc(50% - 1px);
      height: 24px;
      width: 100vh;
    }

    .divider {
      @extend %face-sans-12-medium;

      @include mixins.flex(center, center, row);

      gap: 2px;
      color: variables.$color-blue;
      white-space: nowrap;

      .space,
      .arrow {
        background-image: linear-gradient(variables.$color-blue 2px, transparent 1px);
        width: 12px;
        height: 24px;
        transform: translateY(calc(50% - 1px));
        position: relative;
      }

      .arrow {
        margin-right: 1px;

        svg {
          position: absolute;
          transform: translateY(-5px);
          left: 7px;
          width: 9px;
          height: 12px;
        }
      }
    }
  }
}
</style>
