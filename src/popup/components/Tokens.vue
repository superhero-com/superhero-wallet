<template>
  <span
    class="tokens"
    :class="{ vertical, bright }"
  >
    <AssetIcon
      v-if="!noIcons && imgAsset"
      class="icon"
      :asset="imgAsset"
      :icon-size="iconSize"
    />

    <span class="symbols">
      <span
        v-if="fromAsset"
        class="symbol"
        :title="fromAsset?.name || fromAsset?.symbol"
        v-text="(
          truncateString(fullSymbol ? fromAsset?.name! : fromAsset?.symbol!)
          || $t('common.unrecognized')
        )"
      />
      <span
        v-if="fromAsset && targetAsset"
        class="separator"
      >
        /
      </span>
      <span
        v-if="targetAsset"
        class="symbol"
        :title="targetAsset?.name || targetAsset?.symbol"
        v-text="(
          truncateString(fullSymbol ? targetAsset?.name! : targetAsset?.symbol!)
          || $t('common.unrecognized')
        )"
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
import {
  truncateString as truncateStringFactory,
} from '@/utils';

import AssetIcon, { AllowedAssetIconSize } from './AssetIcon.vue';

export default defineComponent({
  components: {
    AssetIcon,
  },
  props: {
    /**
     * Array of tokens that is returned by the transactionTokenInfoResolvers
     */
    tokens: { type: Array as PropType<ITokenResolved[]>, required: true },
    symbolLength: { type: Number, default: 10 },
    doubleSymbolLength: { type: Number, default: 5 },
    /**
     * TODO if protocol is not set, assume AE, but this should be set correctly
     */
    protocol: { type: String as PropType<Protocol>, default: PROTOCOLS.aeternity },
    iconSize: { type: String as PropType<AllowedAssetIconSize>, default: ICON_SIZES.sm },
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
        .map(({ symbol }) => symbol?.length || 0)
        .find((length) => length < props.doubleSymbolLength);
      return shorterNameLength ? props.symbolLength - shorterNameLength : props.doubleSymbolLength;
    }

    function truncateString(text: string) {
      const maxLength = getAvailableCharLength();
      return truncateStringFactory(text, maxLength);
    }

    const fromAsset = computed(() => props.tokens?.[0]);
    const targetAsset = computed(() => props.tokens?.[1]);
    const imgAsset = computed(() => props.tokens?.[2] || fromAsset.value);

    return {
      ASSET_TYPES,
      fromAsset,
      targetAsset,
      imgAsset,
      truncateString,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.tokens {
  @extend %face-sans-16-semi-bold;

  display: inline-flex;
  align-items: center;
  color: rgba($color-white, 0.75);
  letter-spacing: -2%;

  &.bright {
    color: $color-white;
  }

  .icon {
    user-select: none;
    margin-right: 4px;
  }

  .symbols {
    .symbol {
      @extend %text-body;

      white-space: nowrap;
      letter-spacing: -0.02em;
    }
  }

  .separator {
    margin: 0 1px;
    vertical-align: middle;
  }

  &.vertical {
    flex-direction: column;

    .symbols {
      @extend %face-sans-18-medium;

      .separator {
        color: rgba($color-white, 0.75);
      }
    }

    .icon {
      margin-right: 0;
      margin-bottom: 8px;
    }
  }
}
</style>
