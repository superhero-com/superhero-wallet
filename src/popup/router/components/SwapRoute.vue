<template>
  <div
    v-if="tokenPairs.length > 1"
    class="swap-route"
  >
    <div class="title">
      {{ $t('pages.transactionDetails.swapRoute') }}
    </div>
    <span
      v-for="(pairs, idx) of tokenPairs"
      :key="idx"
      class="swap"
    >
      <span
        v-if="idx"
        class="divider"
      >
        {{ idx === 1 ? '--->' : '------>' }}
      </span>

      <Tokens :tokens="pairs" />
    </span>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { camelCase } from 'lodash-es';
import Tokens from './Tokens.vue';
import * as transactionTokenInfoResolvers from '../../utils/transactionTokenInfoResolvers';
import { DEX_CONTRACTS, FUNCTION_TYPE_DEX } from '../../utils/constants';

export default {
  components: {
    Tokens,
  },
  props: {
    transaction: { type: Object, required: true },
  },
  computed: {
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapGetters(['activeNetwork']),
    isSwapTx() {
      return FUNCTION_TYPE_DEX.swap.includes(this.transaction.tx.function);
    },
    tokenPairs() {
      if (!this.isSwapTx) return [];
      if (!transactionTokenInfoResolvers[camelCase(this.transaction.tx.function)]) return [];
      const contracts = DEX_CONTRACTS[this.activeNetwork.networkId];
      const { tokens } = transactionTokenInfoResolvers[camelCase(this.transaction.tx.function)](
        this.transaction, this.availableTokens,
      );

      if (tokens.length && contracts?.wae?.includes(tokens[0].contractId)) {
        tokens.unshift({
          ...tokens[0],
          isAe: true,
        });
      }
      return tokens.map((token, idx) => {
        if (!idx || idx + 1 === tokens.length) {
          return [token];
        }
        return [
          token,
          tokens[idx + 1],
        ];
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.swap-route {
  width: 100%;
  padding-bottom: 10px;

  .title {
    color: variables.$color-dark-grey;
    padding-bottom: 8px;

    @extend %face-sans-14-medium;
  }

  .swap {
    padding: 4px 0;

    .divider {
      color: variables.$color-blue;
      margin: 0 4px;
      padding-bottom: 7px;
      word-break: break-all;
      vertical-align: middle;
    }

    .fee {
      margin-left: 4px;
      color: variables.$color-dark-grey;
      vertical-align: middle;

      @extend %face-sans-14-regular;
    }
  }
}
</style>
