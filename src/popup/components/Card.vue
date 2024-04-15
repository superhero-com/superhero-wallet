<template>
  <transition name="fade-transition">
    <div
      v-if="isVisible"
      class="card"
      :class="{
        dense,
        disabled,
      }"
      :style="styleComponent"
    >
      <IconWrapper
        v-if="icon"
        :icon="icon"
        class="card-icon"
        is-boxed
      />

      <div>
        <div class="text">
          {{ text }}
        </div>
        <div class="description">
          {{ description }}
        </div>
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
import { PropType, computed, defineComponent } from 'vue';
import { useUi } from '@/composables';

import BtnIcon from './buttons/BtnIcon.vue';
import CloseIcon from '../../icons/times-circle.svg?vue-component';
import IconWrapper from './IconWrapper.vue';

export default defineComponent({
  name: 'Card',
  components: {
    BtnIcon,
    IconWrapper,
  },
  props: {
    text: { type: String, required: true },
    description: { type: String, required: true },
    background: { type: String, default: null },
    cardId: { type: String as PropType<string | null>, default: null },
    icon: { type: Object, default: null },
    dense: Boolean,
    disabled: Boolean,
  },
  setup(props) {
    const { hiddenCards, setCardHidden } = useUi();

    const styleComponent = computed(() => ({
      backgroundImage: props.background ? `url("${props.background}")` : null,
    }));

    const isVisible = computed(
      () => !(
        props.cardId
        && hiddenCards.value.includes(props.cardId)
      ),
    );

    return {
      CloseIcon,
      styleComponent,
      isVisible,
      hiddenCards,
      setCardHidden,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';
@use '../../styles/mixins';

.card {
  z-index: 1;
  position: relative;
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-height: 116px;
  border-radius: $border-radius-interactive;
  padding: 20px 16px;
  gap: 16px;
  background-color: $color-bg-6;
  background-repeat: no-repeat;
  background-size: cover;
  transition: $transition-interactive;

  &-darken::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0;
    background-color: var(--screen-bg-color);
    opacity: 0.7;
  }

  .card-icon {
    color: $color-white;
  }

  .card-close {
    position: absolute;
    top: 4px;
    right: 4px;
  }

  .text {
    @extend %face-sans-16-bold;

    color: $color-white;
  }

  .description {
    @extend %face-sans-13-regular;

    color: $color-white;
    opacity: 0.7;
    margin-top: 4px;
  }

  &.dense {
    .description {
      margin-top: 0;
    }
  }

  &.disabled {
    pointer-events: none;
    opacity: 0.4;
  }
}
</style>
