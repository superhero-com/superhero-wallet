<template>
  <span
    class="tokens"
    :class="{ vertical }"
  >
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
        class="separator"
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
import AeIcon from '../../icons/tokens/ae.svg';
import { AETERNITY_CONTRACT_ID } from '../utils/constants';

export default {
  props: {
    /**
     * transactionTokenInfoResolvers []
     */
    tokens: { type: Array, required: true },
    symbolLength: { type: Number, default: 11 },
    doubleSymbolLength: { type: Number, default: 5 },
    vertical: Boolean,
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
@use '../../styles/variables';
@use '../../styles/typography';

.tokens {
  @extend %face-sans-14-regular;

  color: variables.$color-grey-light;

  &,
  .symbols,
  .icons {
    display: inline-flex;
    align-items: center;
    align-self: center;
  }

  .symbol {
    vertical-align: middle;
    white-space: nowrap;
  }

  .separator {
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
      border: 0.25px solid variables.$color-grey-light;
    }
  }

  &.vertical {
    flex-direction: column;

    .symbols {
      @extend %face-sans-18-medium;

      .separator {
        color: variables.$color-grey-light;
      }
    }

    .icons {
      margin-bottom: 8px;

      img {
        width: 44px;
        height: 44px;
        margin: 0;
        border-radius: 22px;

        &.pair {
          margin-left: -80px;
        }
      }
    }
  }
}
</style>
