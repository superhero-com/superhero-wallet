<template>
  <span
    class="tokens"
    :class="[iconSize, { vertical }]"
  >
    <span class="icons">
      <img
        v-if="toToken && !noIcons"
        :src="toToken.img"
        :class="['to-token', { border: toToken.imgBorder }]"
        :title="toToken.symbol"
      >
      <img
        v-if="fromToken && !noIcons"
        :src="fromToken.img"
        :class="{
          border: fromToken.imgBorder,
          pair: !!toToken,
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
import { computed, defineComponent } from '@vue/composition-api';
import AeIcon from '../../icons/tokens/ae.svg';
import {
  AETERNITY_COIN_SYMBOL,
  AETERNITY_CONTRACT_ID,
  AETERNITY_SYMBOL,
  shrinkString as shrinkStringFactory,
} from '../utils';

const SIZES = ['rg', 'md', 'xl']; // TODO - add more sizes to icons

export default defineComponent({
  props: {
    /**
     * transactionTokenInfoResolvers []
     */
    tokens: { type: Array, required: true },
    symbolLength: { type: Number, default: 11 },
    doubleSymbolLength: { type: Number, default: 5 },
    iconSize: {
      type: String,
      default: 'rg',
      validator: (val) => SIZES.includes(val),
    },
    vertical: Boolean,
    noIcons: Boolean,
    fullAeSymbol: Boolean,
  },
  setup(props) {
    function getAvailableCharLength() {
      if (props.tokens?.length < 2) return props.symbolLength;
      const shorterNameLength = [props.tokens[0].symbol.length, props.tokens[1].symbol.length]
        .find((length) => length < props.doubleSymbolLength);
      return shorterNameLength ? props.symbolLength - shorterNameLength : props.doubleSymbolLength;
    }

    function shrinkString(text) {
      const maxLength = getAvailableCharLength();
      return shrinkStringFactory(text, maxLength);
    }

    function mapToken(token) {
      let img = `https://avatars.z52da5wt.xyz/${token.contractId}`;
      let imgBorder = true;

      if (token.isAe || token.contractId === AETERNITY_CONTRACT_ID) {
        img = AeIcon;
        imgBorder = false;
      }

      const aeSymbol = props.fullAeSymbol ? AETERNITY_COIN_SYMBOL : AETERNITY_SYMBOL;

      return {
        ...token,
        symbol: token.isAe ? aeSymbol : token.symbol,
        name: token.isAe ? 'Aeternity' : token.symbol,
        img,
        imgBorder,
      };
    }

    const fromToken = computed(() => (props.tokens?.[0] ? mapToken(props.tokens[0]) : null));
    const toToken = computed(() => (props.tokens?.[1] ? mapToken(props.tokens[1]) : null));

    return {
      fromToken,
      toToken,
      shrinkString,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.tokens {
  --icon-size: 16px;

  @extend %face-sans-15-medium;

  color: rgba(variables.$color-white, 0.75);

  &,
  .symbols,
  .icons {
    display: inline-flex;
    align-items: center;
    align-self: center;
  }

  .symbol {
    @extend %face-sans-16-medium;

    vertical-align: middle;
    white-space: nowrap;
    line-height: 20px;
  }

  .separator {
    margin: 0 1px;
    vertical-align: middle;
  }

  &.md {
    --icon-size: 18px;
  }

  &.xl {
    --icon-size: 30px;
  }

  img {
    width: var(--icon-size);
    height: var(--icon-size);
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
      border: 0.25px solid rgba(variables.$color-white, 0.75);
    }
  }

  &.vertical {
    flex-direction: column;

    .symbols {
      @extend %face-sans-18-medium;

      .separator {
        color: rgba(variables.$color-white, 0.75);
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
