<template>
  <BtnPlain
    class="select-asset"
    :class="{ focused, disabled }"
    @click="openAssetSelector"
  >
    {{ displayToken }}
    <ChevronDown
      v-if="!disabled"
      class="chevron-down"
    />
  </BtnPlain>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import type { IAsset, IToken } from '@/types';
import { MODAL_ASSET_SELECTOR } from '@/constants';
import { useModals } from '@/composables';

import { AssetSelectorResolvedVal } from '@/popup/components/Modals/AssetSelector.vue';

import ChevronDown from '@/icons/chevron-down.svg?vue-component';
import BtnPlain from './buttons/BtnPlain.vue';

export default defineComponent({
  components: {
    BtnPlain,
    ChevronDown,
  },
  props: {
    value: { type: Object as PropType<IAsset>, default: null },
    disabled: Boolean,
    focused: Boolean,
    withBalanceOnly: Boolean,
  },
  emits: ['select-asset'],
  setup(props, { emit }) {
    const { openModal } = useModals();

    const displayToken = computed(() => {
      if (props.value) {
        const { symbol } = props.value;
        return `${String(symbol).substring(0, 11)}${symbol.length > 11 ? '...' : ''}`;
      }
      return '';
    });

    function handleChange(token: IToken) {
      emit('select-asset', token);
    }

    function openAssetSelector() {
      if (!props.disabled) {
        openModal<AssetSelectorResolvedVal>(MODAL_ASSET_SELECTOR, {
          selectedToken: props.value,
          withBalanceOnly: props.withBalanceOnly,
          resolve: (token) => token,
        })
          .then((token) => handleChange(token))
          .catch(() => {}); // closing the modal rejects the promise
      }
    }

    return {
      displayToken,
      handleChange,
      openAssetSelector,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.select-asset {
  @include mixins.flex(center, center);

  @extend %face-sans-14-medium;

  padding: 2px 12px;
  background-color: rgba($color-black, 0.3);
  border-radius: 16px;
  gap: 6px;
  color: $color-primary;
  white-space: nowrap;
  border: 2px solid transparent;
  transition: all 0.12s ease-out;

  .chevron-down {
    width: 8px !important;
    color: $color-white;
    opacity: 0.75;
  }

  &:not(.disabled) {
    &:hover {
      border-color: rgba($color-white, 0.15);
    }

    &.focused {
      background-color: rgba($color-white, 0.05);
    }
  }
}
</style>
