<template>
  <transition name="fade-transition">
    <div
      v-if="!isHidden"
      class="card"
      :class="[
        `variant-${variant}`,
        {
          dense,
          disabled,
          'icon-centered': iconCentered,
        },
      ]"
      :style="styleComponent"
    >
      <slot name="icon">
        <IconWrapper
          v-if="icon"
          :icon="icon"
          class="card-icon"
          is-boxed
        />
      </slot>

      <div class="card-content">
        <div
          v-if="text"
          class="text"
          v-text="text"
        />
        <div
          v-if="description"
          class="description"
          v-text="description"
        />

        <slot />
      </div>

      <div
        v-if="cardId"
        class="card-close"
      >
        <BtnIcon
          :icon="CloseIcon"
          @click="setCardHidden(cardId)"
        />
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import {
  Component,
  PropType,
  computed,
  defineComponent,
} from 'vue';
import { useUi } from '@/composables';

import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';
import IconWrapper from '@/popup/components/IconWrapper.vue';

import CloseIcon from '@/icons/times-circle.svg?vue-component';

export default defineComponent({
  name: 'Card',
  components: {
    BtnIcon,
    IconWrapper,
  },
  props: {
    text: { type: String, default: null },
    description: { type: String, default: null },
    background: { type: String, default: null },
    cardId: { type: String as PropType<string | null>, default: null },
    icon: { type: Object as PropType<Component>, default: null },
    variant: { type: String, default: 'default' },
    iconCentered: Boolean,
    dense: Boolean,
    disabled: Boolean,
  },
  setup(props) {
    const { hiddenCards, setCardHidden } = useUi();

    const styleComponent = computed(() => ({
      backgroundImage: props.background ? `url("${props.background}")` : undefined,
    }));

    const isHidden = computed(() => (
      props.cardId
      && !hiddenCards.value.includes(props.cardId)
    ));

    return {
      CloseIcon,
      styleComponent,
      isHidden,
      hiddenCards,
      setCardHidden,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.card {
  z-index: 1;
  position: relative;
  display: flex;
  width: 100%;
  border-radius: $border-radius-interactive;
  padding: 20px 16px;
  gap: 16px;
  background-color: $color-bg-6;
  background-repeat: no-repeat;
  background-size: cover;
  color: $color-white;
  transition: $transition-interactive;

  .card-icon {
    color: $color-white;
  }

  .card-content {
    width: 100%;
    overflow: hidden;
  }

  .card-close {
    position: absolute;
    top: 4px;
    right: 4px;
  }

  .text {
    @extend %face-sans-16-semi-bold;
  }

  .description {
    @extend %face-sans-13-regular;

    opacity: 0.7;
    margin-top: 4px;
  }

  &.dense {
    padding: 6px 8px;
    gap: 8px;

    .description {
      margin-top: 1px;
    }
  }

  &.disabled {
    pointer-events: none;
    opacity: 0.4;
  }

  &.icon-centered {
    align-items: center;
  }

  &.variant {
    &-warning {
      color: $color-warning;
      background-color: rgba($color-warning, 0.15);
    }
  }
}
</style>
