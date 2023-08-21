<template>
  <span
    class="tokens"
    :class="[iconSize, { vertical, bright }]"
  >
    <span
      v-if="!noIcons"
      class="icons"
    >
      <img
        :src="imgToken.image || getTokenPlaceholderUrl(imgToken)"
        :class="{ 'with-border': !imgToken.image }"
        :title="imgToken.symbol"
      >
    </span>

    <span class="symbols">
      <span
        v-if="fromToken"
        class="symbol"
      >
        {{ truncateString(fromToken.symbol) }}
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
        {{ truncateString(toToken.symbol) }}
      </span>
    </span>
  </span>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { ITokenResolved } from '../../types';
import {
  AETERNITY_COIN_NAME,
  AETERNITY_COIN_SYMBOL,
  AETERNITY_CONTRACT_ID,
  AETERNITY_SYMBOL,
  AVATAR_URL,
  truncateString as truncateStringFactory,
} from '../utils';
import AeIcon from '../../icons/tokens/ae.svg';

const SIZES = ['rg', 'md', 'lg', 'xl'] as const;

export type AllowedTokenIconSize = typeof SIZES[number];

export default defineComponent({
  props: {
    /**
     * transactionTokenInfoResolvers []
     */
    tokens: { type: Array as PropType<ITokenResolved[]>, required: true },
    symbolLength: { type: Number, default: 11 },
    doubleSymbolLength: { type: Number, default: 5 },
    iconSize: {
      type: String,
      default: 'rg',
      validator: (val: AllowedTokenIconSize) => SIZES.includes(val),
    },
    vertical: Boolean,
    noIcons: Boolean,
    fullAeSymbol: Boolean,
    bright: Boolean,
  },
  setup(props) {
    function getAvailableCharLength() {
      if (props.tokens?.length < 2) {
        return props.symbolLength;
      }
      const shorterNameLength = props.tokens
        .map(({ symbol }) => symbol.length)
        .find((length) => length < props.doubleSymbolLength);
      return shorterNameLength ? props.symbolLength - shorterNameLength : props.doubleSymbolLength;
    }

    function truncateString(text: string) {
      const maxLength = getAvailableCharLength();
      return truncateStringFactory(text, maxLength);
    }

    function getTokenPlaceholderUrl(token: ITokenResolved) {
      return `${AVATAR_URL}${token.contractId}`;
    }

    function mapToken(token: ITokenResolved): ITokenResolved {
      let { image, symbol } = token;
      let name = token.symbol;

      if (token.isAe || token.contractId === AETERNITY_CONTRACT_ID) {
        image = AeIcon;
        symbol = props.fullAeSymbol ? AETERNITY_COIN_SYMBOL : AETERNITY_SYMBOL;
        name = AETERNITY_COIN_NAME;
      }

      return {
        ...token,
        symbol,
        name,
        image,
      };
    }

    const fromToken = computed(() => (props.tokens?.[0] ? mapToken(props.tokens[0]) : null));
    const toToken = computed(() => (props.tokens?.[1] ? mapToken(props.tokens[1]) : null));
    const imgToken = computed(() => (
      props.tokens?.[2]
        ? mapToken(props.tokens[2])
        : fromToken.value
    ));

    return {
      fromToken,
      toToken,
      imgToken,
      getTokenPlaceholderUrl,
      truncateString,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.tokens {
  --icon-size: 16px;

  @extend %face-sans-16-semi-bold;

  color: rgba(variables.$color-white, 0.75);
  letter-spacing: -2%;

  &.bright {
    color: variables.$color-white;
  }

  &,
  .symbols,
  .icons {
    display: inline-flex;
    align-items: center;
    align-self: center;
  }

  .icons {
    user-select: none;
  }

  .symbol {
    @extend %face-sans-16-regular;

    vertical-align: middle;
    white-space: nowrap;
    line-height: 20px;
    letter-spacing: -0.02em;
  }

  .separator {
    margin: 0 1px;
    vertical-align: middle;
  }

  &.md {
    --icon-size: 18px;
  }

  &.lg {
    --icon-size: 24px;
  }

  &.xl {
    --icon-size: 30px;
  }

  img {
    width: var(--icon-size);
    height: var(--icon-size);
    border-radius: calc(var(--icon-size) / 2);
    vertical-align: middle;
    margin-right: 4px;

    &.with-border {
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
      }
    }
  }
}
</style>
