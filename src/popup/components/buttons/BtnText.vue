<template>
  <BtnPlain
    class="btn-text"
    :class="{
      'has-icon': hasIcon,
    }"
    @click="$emit('click')"
  >
    <slot />
  </BtnPlain>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import BtnPlain from './BtnPlain.vue';

export default defineComponent({
  name: 'BtnText',
  components: { BtnPlain },
  props: {
    hasIcon: { type: Boolean },
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/typography';
@use '../../../styles/variables'   ;

.btn-text {
  @extend %face-sans-14-medium;

  color: variables.$color-primary;
  display: flex;
  align-items: center;
  padding: 2px 4px 2px 0;
  text-transform: uppercase;
  gap: 4px;
  width: fit-content;

  &:hover {
    border-radius: 8px;
    background: rgba(variables.$color-primary, 0.15);
  }

  &.has-icon {
    gap: 4px;

    ::v-deep .icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      color: inherit;
    }
  }
}
</style>
