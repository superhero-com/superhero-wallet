<template>
  <BtnPlain
    class="btn-text"
    :class="{
      'has-icon': !!icon,
    }"
    :disabled="disabled"
  >
    <Component
      :is="icon"
      v-if="icon"
      class="btn-text-icon"
    />

    <slot>{{ text }}</slot>
  </BtnPlain>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import BtnPlain from './BtnPlain.vue';

export default defineComponent({
  name: 'BtnText',
  components: { BtnPlain },
  props: {
    text: { type: String, default: '' },
    icon: { type: Object, default: null },
    disabled: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/typography';
@use '../../../styles/variables';

.btn-text {
  @extend %face-sans-14-medium;

  color: variables.$color-primary;
  display: flex;
  align-items: center;
  padding: 2px 4px 2px 0;
  text-transform: uppercase;
  gap: 4px;
  width: fit-content;

  &:hover:not([disabled]) {
    border-radius: 8px;
    background: rgba(variables.$color-primary, 0.15);
  }

  &.has-icon {
    gap: 4px;

    .btn-text-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      color: inherit;
    }
  }
}
</style>
