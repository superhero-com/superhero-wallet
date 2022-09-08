<template>
  <span class="tokens">
    <span class="icons">
      <img
        v-if="toToken"
        :src="toToken.img"
        :class="['to-token', { border: toToken.imgBorder }]"
        :title="toToken.symbol"
      >
      <img
        :src="fromToken.img"
        :class="{
          border: fromToken.imgBorder,
          pair: !!toToken
        }"
        :title="fromToken.symbol"
      >
    </span>
    <span class="symbols">
      <span
        v-if="fromToken"
        class="symbol"
      >
        {{ shrinkString(fromToken.symbol) }}
      </span>
      <span
        v-if="fromToken && toToken"
        class="seperator"
      >
        /
      </span>
      <span
        v-if="toToken"
        class="symbol"
      >
        {{ shrinkString(toToken.symbol) }}
      </span>
    </span>
  </span>
</template>

<script>
import AeIcon from '../../../icons/tokens/ae.svg';
import { AETERNITY_CONTRACT_ID } from '../../utils/constants';

export default {
  props: {
    /**
     * transactionTokenInfoResolvers []
     */
    tokens: { type: Array, required: true },
    symbolLength: { type: Number, default: 11 },
    doubleSymbolLength: { type: Number, default: 5 },
  },
  computed: {
    fromToken() {
      return this.tokens?.[0] ? this.mapToken(this.tokens[0]) : null;
    },
    toToken() {
      return this.tokens?.[1] ? this.mapToken(this.tokens[1]) : null;
    },
  },
  methods: {
    getAvailableCharLength() {
      if (this.tokens?.length < 2) return this.symbolLength;
      const shorterNameLength = [this.tokens[0].symbol.length, this.tokens[1].symbol.length]
        .find((length) => length < this.doubleSymbolLength);
      return shorterNameLength ? this.symbolLength - shorterNameLength : this.doubleSymbolLength;
    },
    shrinkString(text) {
      const maxLength = this.getAvailableCharLength();
      return `${String(text).substring(0, maxLength)}${text.length > maxLength ? '...' : ''}`;
    },
    mapToken(token) {
      let img = `https://avatars.z52da5wt.xyz/${token.contractId}`;
      let imgBorder = true;

      if (token.isAe || token.contractId === AETERNITY_CONTRACT_ID) {
        img = AeIcon;
        imgBorder = false;
      }

      return {
        ...token,
        symbol: token.isAe ? 'AE' : token.symbol,
        name: token.isAe ? 'Aeternity' : token.symbol,
        img,
        imgBorder,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.tokens {
  color: variables.$color-light-grey;

  &,
  .symbols,
  .icons {
    display: inline-flex;
    align-items: center;
    align-self: center;
  }

  @extend %face-sans-14-regular;

  .symbol {
    vertical-align: middle;
    white-space: nowrap;
  }

  .seperator {
    margin: 0 1px;
    vertical-align: middle;
  }

  img {
    width: 16px;
    height: 16px;
    border-radius: 8px;
    vertical-align: middle;
    margin-right: 4px;

    &.to-token {
      margin-left: 10px;
    }

    &.pair {
      margin-right: 16px;
      margin-left: -30px;
    }

    &.border {
      border: 0.25px solid variables.$color-light-grey;
    }
  }
}
</style>
