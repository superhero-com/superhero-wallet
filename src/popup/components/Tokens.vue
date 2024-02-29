<template>
  <span
    class="tokens"
    :class="[iconSize, { vertical, bright }]"
  >
    <span
      v-if="!noIcons"
      class="icon"
    >
      <AssetIcon
        v-if="imgToken"
        class="icon-image"
        :contract-id="getDisplayTokenContractId(imgToken)!"
        :icon-size="(iconSize as any)"
      >
        <template #fallback>
          <img
            class="icon-image"
            :src="imgToken?.image || getTokenPlaceholderUrl(imgToken!)"
            :class="{ 'with-border': !imgToken?.image }"
            :title="imgToken?.symbol"
          >
        </template>
      </AssetIcon>
    </span>

    <span class="symbols">
      <span
        v-if="fromToken"
        class="symbol"
        v-text="truncateString(fromToken?.name ?? fromToken?.symbol)"
      />
      <span
        v-if="fromToken && toToken"
        class="separator"
      >
        /
      </span>
      <span
        v-if="toToken"
        class="symbol"
        v-text="truncateString(toToken?.name ?? toToken?.symbol)"
      />
    </span>
  </span>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import type { ITokenResolved, Protocol } from '@/types';
import {
  ASSET_TYPES,
  ICON_SIZES,
  PROTOCOLS,
} from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import {
  isCoin,
  truncateString as truncateStringFactory,
} from '@/utils';
import { AE_AVATAR_URL } from '@/protocols/aeternity/config';

import AssetIcon from './AssetIcon.vue';

const SIZES = [ICON_SIZES.sm, ICON_SIZES.rg, ICON_SIZES.lg, ICON_SIZES.xxl] as const;

export type AllowedTokenIconSize = typeof SIZES[number];

export default defineComponent({
  components: {
    AssetIcon,
  },
  props: {
    /**
     * Array of tokens that is returned by the transactionTokenInfoResolvers
     */
    tokens: { type: Array as PropType<ITokenResolved[]>, required: true },
    symbolLength: { type: Number, default: 11 },
    doubleSymbolLength: { type: Number, default: 5 },
    /**
     * TODO if protocol is not set, assume AE, but this should be set correctly
     */
    protocol: { type: String as PropType<Protocol>, default: PROTOCOLS.aeternity },
    iconSize: {
      type: String as PropType<AllowedTokenIconSize>,
      default: ICON_SIZES.sm,
      validator: (val: AllowedTokenIconSize) => SIZES.includes(val),
    },
    vertical: Boolean,
    noIcons: Boolean,
    fullSymbol: Boolean,
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
      // TODO Should not be protocol specific
      return `${AE_AVATAR_URL}${token.contractId}`;
    }

    /**
     * Some transactions are contract calls, but we still want to display the coin icon
     * Thus if the transaction should display a coin, we use the protocol as contractId
     */
    function getDisplayTokenContractId(token: ITokenResolved) {
      const protocolCoinContractId = ProtocolAdapterFactory
        .getAdapter(token?.protocol ?? props.protocol).coinContractId;
      return token.assetType === ASSET_TYPES.coin ? protocolCoinContractId : token.contractId;
    }

    function mapToken(token: ITokenResolved): ITokenResolved {
      const isTokenCoin = isCoin(token.contractId!) || token.isAe;
      const protocol = token.protocol || props.protocol;
      const adapter = ProtocolAdapterFactory.getAdapter(protocol);
      let name = token.symbol;
      if (isTokenCoin) {
        name = props.fullSymbol ? adapter.coinName : adapter.protocolSymbol;
      }

      return {
        ...token,
        name,
        protocol,
        assetType: isTokenCoin ? ASSET_TYPES.coin : ASSET_TYPES.token,
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
      ASSET_TYPES,
      fromToken,
      toToken,
      imgToken,
      getTokenPlaceholderUrl,
      getDisplayTokenContractId,
      truncateString,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.tokens {
  --icon-size: var(--icon-size-sm);

  @extend %face-sans-16-semi-bold;

  color: rgba(variables.$color-white, 0.75);
  letter-spacing: -2%;

  &.bright {
    color: variables.$color-white;
  }

  &,
  .symbols,
  .icon {
    display: inline-flex;
    align-items: center;
    align-self: center;
  }

  .icon {
    user-select: none;
    width: max-content;

    .icon-image {
      width: var(--icon-size);
      height: var(--icon-size);
      border-radius: calc(var(--icon-size) / 2);
      vertical-align: middle;
      margin-right: 4px;

      &.with-border {
        border: 0.25px solid rgba(variables.$color-white, 0.75);
      }
    }
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

  &.rg {
    --icon-size: var(--icon-size-rg);
  }

  &.lg {
    --icon-size: var(--icon-size-lg);
  }

  &.xxl {
    --icon-size: var(--icon-size-xxl);
  }

  &.vertical {
    flex-direction: column;

    .symbols {
      @extend %face-sans-18-medium;

      .separator {
        color: rgba(variables.$color-white, 0.75);
      }
    }

    .icon {
      margin-bottom: 8px;

      .icon-image {
        width: 44px;
        height: 44px;
        margin: 0;
        border-radius: 22px;
      }
    }
  }
}
</style>
