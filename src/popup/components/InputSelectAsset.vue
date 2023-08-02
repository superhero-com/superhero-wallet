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
import { computed, defineComponent } from 'vue';
import type { IToken } from '@/types';
import { useModals } from '@/composables';
import { MODAL_ASSET_SELECTOR } from '@/config';
import ChevronDown from '../../icons/chevron-down.svg?vue-component';
import BtnPlain from './buttons/BtnPlain.vue';

export default defineComponent({
  components: {
    BtnPlain,
    ChevronDown,
  },
  props: {
    value: { type: Object, default: null },
    disabled: Boolean,
    focused: Boolean,
    showTokensWithBalance: Boolean,
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
        openModal(MODAL_ASSET_SELECTOR, {
          selectedToken: props.value,
          showTokensWithBalance: props.showTokensWithBalance,
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
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.select-asset {
  @include mixins.flex(center, center);

  @extend %face-sans-14-medium;

  padding: 2px 12px;
  background-color: rgba(variables.$color-black, 0.3);
  border-radius: 16px;
  gap: 6px;
  color: variables.$color-primary;
  white-space: nowrap;
  border: 2px solid transparent;
  transition: all 0.12s ease-out;

  .chevron-down {
    width: 8px !important;
    color: variables.$color-white;
    opacity: 0.75;
  }

  &:not(.disabled) {
    &:hover {
      border-color: rgba(variables.$color-white, 0.15);
    }

    &.focused {
      background-color: rgba(variables.$color-white, 0.05);
    }
  }
}
</style>
