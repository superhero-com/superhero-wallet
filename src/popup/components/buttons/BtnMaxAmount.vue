<template>
  <BtnPlain
    class="max-button"
    :class="{ chosen: isMax }"
    :text="$t('common.max')"
    @click="$emit('click')"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import BtnPlain from './BtnPlain.vue';

export default defineComponent({
  name: 'BtnMaxAmount',
  components: {
    BtnPlain,
  },
  props: {
    isMax: Boolean,
  },
  emits: ['click'],
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables';
@use '@/styles/typography';

.max-button {
  @extend %face-sans-14-medium;

  padding: 2px 8px;
  color: variables.$color-primary;
  line-height: 20px;
  border: 2px solid transparent;
  border-radius: 12px;

  &:hover {
    background: rgba(variables.$color-primary, 0.15);
  }

  &.chosen {
    background: rgba(variables.$color-primary, 0.15);
    border-color: rgba(variables.$color-primary, 0.5);
  }
}
</style>
